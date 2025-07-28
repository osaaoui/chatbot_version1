import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import List, Optional, Dict, Any
import os
from app.core.config import settings
from app.core.base_service import ServiceError
from app.core.circuit_breaker import circuit_breaker
import asyncio

class EmailService:
    """
    Servicio asíncrono para envío de emails usando SMTP
    """
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS
        
        # Configurar Jinja2 para templates
        if os.path.exists(settings.EMAIL_TEMPLATES_DIR):
            self.jinja_env = Environment(
                loader=FileSystemLoader(settings.EMAIL_TEMPLATES_DIR),
                autoescape=select_autoescape(['html', 'xml'])
            )
        else:
            self.jinja_env = None
    
    async def _create_smtp_connection(self) -> aiosmtplib.SMTP:
        """Crear conexión SMTP asíncrona"""
        try:
            # Para puerto 465: usar SSL directo
            # Para puerto 587: usar TLS/STARTTLS
            if self.smtp_port == 465:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=True,  # SSL directo para puerto 465
                    timeout=30
                )
            else:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=self.use_tls,  # STARTTLS para puerto 587
                    timeout=30
                )
            
            await smtp.connect()
            
            if self.smtp_username and self.smtp_password:
                await smtp.login(self.smtp_username, self.smtp_password)
                
            return smtp
            
        except Exception as e:
            raise ServiceError(f"Failed to connect to SMTP server: {str(e)}", 503)

    def _create_message(
        self,
        to_email: str,
        subject: str,
        html_content: str = None,
        text_content: str = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> MIMEMultipart:
        """Crear mensaje de email"""
        
        message = MIMEMultipart('alternative')
        message['From'] = f"{self.from_name} <{self.from_email}>"
        message['To'] = to_email
        message['Subject'] = subject
        
        # Agregar contenido de texto plano
        if text_content:
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            message.attach(text_part)
        
        # Agregar contenido HTML
        if html_content:
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
        
        # Agregar archivos adjuntos
        if attachments:
            for attachment in attachments:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment['content'])
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment["filename"]}'
                )
                message.attach(part)
        
        return message

    @circuit_breaker(
        name="email_send",
        failure_threshold=3,
        recovery_timeout=60.0,
        timeout=30.0
    )
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str = None,
        text_content: str = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Enviar email
        
        Args:
            to_email: Email destinatario
            subject: Asunto del email
            html_content: Contenido HTML
            text_content: Contenido texto plano
            attachments: Lista de archivos adjuntos
        
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            if not self.smtp_username or not self.smtp_password:
                raise ServiceError("SMTP credentials not configured", 500)
            
            message = self._create_message(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                attachments=attachments
            )
            
            smtp = await self._create_smtp_connection()
            
            try:
                await smtp.send_message(message)
                return True
            finally:
                await smtp.quit()
                
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to send email: {str(e)}", 500)

    async def send_template_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        template_data: Dict[str, Any] = None
    ) -> bool:
        """
        Enviar email usando template Jinja2
        
        Args:
            to_email: Email destinatario
            subject: Asunto del email
            template_name: Nombre del template (sin extensión)
            template_data: Datos para el template
        
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            if not self.jinja_env:
                raise ServiceError("Email templates directory not found", 500)
            
            template_data = template_data or {}
            
            # Buscar template HTML
            html_content = None
            try:
                html_template = self.jinja_env.get_template(f"{template_name}.html")
                html_content = html_template.render(**template_data)
            except Exception:
                pass  # Template HTML opcional
            
            # Buscar template de texto
            text_content = None
            try:
                text_template = self.jinja_env.get_template(f"{template_name}.txt")
                text_content = text_template.render(**template_data)
            except Exception:
                pass  # Template texto opcional
            
            if not html_content and not text_content:
                raise ServiceError(f"No template found for {template_name}", 404)
            
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to send template email: {str(e)}", 500)

    @circuit_breaker(
        name="email_verification_send",
        failure_threshold=3,
        recovery_timeout=60.0,
        timeout=30.0
    )
    async def send_verification_code(
        self,
        to_email: str,
        verification_code: str,
        expires_minutes: int = 15,
        is_resend: bool = False
    ) -> bool:
        """
        Enviar código de verificación por email
        
        Args:
            to_email: Email destinatario
            verification_code: Código de 6 dígitos
            expires_minutes: Minutos hasta expiración
            is_resend: Si es un reenvío
        
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            # Si existe template, usarlo
            if self.jinja_env:
                try:
                    subject = "Reenvío - Código de Verificación - TiaBot" if is_resend else "Código de Verificación - TiaBot"
                    
                    return await self.send_template_email(
                        to_email=to_email,
                        subject=subject,
                        template_name="verification_code",
                        template_data={
                            'verification_code': verification_code,
                            'expires_minutes': expires_minutes,
                            'to_email': to_email,
                            'is_resend': is_resend
                        }
                    )
                except ServiceError as e:
                    if e.status_code != 404:  # Si no es "template not found"
                        raise
            
            # Fallback: crear email simple sin template
            subject = "Reenvío - Código de Verificación - TiaBot" if is_resend else "Código de Verificación - TiaBot"
            greeting_text = "Has solicitado reenviar tu código de verificación" if is_resend else "Has solicitado verificar tu email para registrarte en TiaBot"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>{subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #333; margin-bottom: 20px;">{"Reenvío - " if is_resend else ""}Código de Verificación</h1>
                    <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
                        {greeting_text}.
                    </p>
                    <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; 
                                padding: 20px; border-radius: 8px; letter-spacing: 4px; margin-bottom: 30px;">
                        {verification_code}
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Este código expira en {expires_minutes} minutos.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Si no solicitaste este código, puedes ignorar este email.
                    </p>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            {subject.upper()}
            
            {greeting_text}.
            
            Tu código de verificación es: {verification_code}
            
            Este código expira en {expires_minutes} minutos.
            
            Si no solicitaste este código, puedes ignorar este email.
            """
            
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Failed to send verification code: {str(e)}", 500)