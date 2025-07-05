# services/user_store.py
import json
import os

USER_FILE = "users.json"

def load_users():
    if not os.path.exists(USER_FILE):
        return {}
    with open(USER_FILE, "r") as f:
        return json.load(f)

def save_users(users: dict):
    with open(USER_FILE, "w") as f:
        json.dump(users, f, indent=2)
