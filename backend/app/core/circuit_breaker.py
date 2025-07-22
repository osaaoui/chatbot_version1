import asyncio
import time
import logging
from typing import Dict, Callable, Optional
from enum import Enum
from dataclasses import dataclass, field
from functools import wraps
import threading

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"   
    OPEN = "OPEN"       
    HALF_OPEN = "HALF_OPEN" 

@dataclass
class CircuitStats:
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: float = 0
    state: CircuitState = CircuitState.CLOSED
    total_requests: int = 0
    consecutive_successes: int = 0
    last_state_change: float = field(default_factory=time.time)

class CircuitBreakerOpenException(Exception):
    def __init__(self, circuit_name: str, message: str = None):
        self.circuit_name = circuit_name
        self.message = message or f"Circuit '{circuit_name}' is OPEN"
        super().__init__(self.message)

class SimpleCircuitBreaker:
    _circuits: Dict[str, CircuitStats] = {}
    _lock = threading.RLock()
    
    @classmethod
    async def call(cls, 
                   name: str,
                   func: Callable,
                   failure_threshold: int = 5,
                   recovery_timeout: float = 60.0,
                   success_threshold: int = 3,
                   timeout: float = 30.0,
                   *args, **kwargs):
        
        with cls._lock:
            if name not in cls._circuits:
                cls._circuits[name] = CircuitStats()
            circuit = cls._circuits[name]
            circuit.total_requests += 1
        
        if circuit.state == CircuitState.OPEN:
            if time.time() - circuit.last_failure_time >= recovery_timeout:
                with cls._lock:
                    circuit.state = CircuitState.HALF_OPEN
                    circuit.success_count = 0
                    circuit.last_state_change = time.time()
                logger.info(f"Circuit '{name}' changed to HALF_OPEN")
            else:
                raise CircuitBreakerOpenException(name)
        
        try:
            result = await asyncio.wait_for(func(*args, **kwargs), timeout=timeout)
            
            with cls._lock:
                if circuit.state == CircuitState.HALF_OPEN:
                    circuit.success_count += 1
                    circuit.consecutive_successes += 1
                    if circuit.success_count >= success_threshold:
                        circuit.state = CircuitState.CLOSED
                        circuit.failure_count = 0
                        circuit.last_state_change = time.time()
                        logger.info(f"Circuit '{name}' RECOVERED to CLOSED")
                elif circuit.state == CircuitState.CLOSED:
                    circuit.failure_count = 0  # Reset on success
                    circuit.consecutive_successes += 1
            
            return result
            
        except asyncio.TimeoutError as e:
            logger.warning(f"Circuit '{name}' timeout after {timeout}s")
            cls._handle_failure(name, circuit, failure_threshold)
            raise e
        except Exception as e:
            logger.warning(f"Circuit '{name}' failed: {str(e)}")
            cls._handle_failure(name, circuit, failure_threshold)
            raise e
    
    @classmethod
    def _handle_failure(cls, name: str, circuit: CircuitStats, failure_threshold: int):
        with cls._lock:
            circuit.failure_count += 1
            circuit.last_failure_time = time.time()
            circuit.consecutive_successes = 0
            
            if circuit.state == CircuitState.CLOSED:
                if circuit.failure_count >= failure_threshold:
                    circuit.state = CircuitState.OPEN
                    circuit.last_state_change = time.time()
                    logger.warning(f"Circuit '{name}' OPENED due to {failure_threshold} failures")
            elif circuit.state == CircuitState.HALF_OPEN:
                circuit.state = CircuitState.OPEN
                circuit.last_state_change = time.time()
                logger.warning(f"Circuit '{name}' failed during HALF_OPEN, back to OPEN")
    
    @classmethod
    def get_stats(cls, name: str) -> dict:
        if name not in cls._circuits:
            return {"error": "Circuit not found"}
        
        circuit = cls._circuits[name]
        current_time = time.time()
        
        return {
            "name": name,
            "state": circuit.state.value,
            "failure_count": circuit.failure_count,
            "success_count": circuit.success_count,
            "consecutive_successes": circuit.consecutive_successes,
            "total_requests": circuit.total_requests,
            "last_failure": circuit.last_failure_time,
            "last_state_change": circuit.last_state_change,
            "uptime_seconds": current_time - circuit.last_state_change if circuit.state == CircuitState.CLOSED else 0,
            "health_ratio": circuit.success_count / max(circuit.total_requests, 1) * 100
        }
    
    @classmethod
    def get_all_circuits(cls) -> Dict[str, dict]:
        return {name: cls.get_stats(name) for name in cls._circuits.keys()}
    
    @classmethod
    def reset_circuit(cls, name: str) -> bool:
        if name not in cls._circuits:
            return False
        
        with cls._lock:
            circuit = cls._circuits[name]
            circuit.state = CircuitState.CLOSED
            circuit.failure_count = 0
            circuit.success_count = 0
            circuit.consecutive_successes = 0
            circuit.last_state_change = time.time()
        
        logger.info(f"Circuit '{name}' manually reset to CLOSED")
        return True

def circuit_breaker(
    name: str = None,
    failure_threshold: int = 5,    
    recovery_timeout: float = 60.0,
    success_threshold: int = 3,    
    timeout: float = 30.0          
):
    def decorator(func):
        circuit_name = name or f"{func.__module__}.{func.__name__}"
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await SimpleCircuitBreaker.call(
                    circuit_name, func,
                    failure_threshold, recovery_timeout, 
                    success_threshold, timeout,
                    *args, **kwargs
                )
            except CircuitBreakerOpenException:
                from app.core.base_service import ServiceError
                raise ServiceError("Service temporarily unavailable", 503)
        
        return wrapper
    return decorator