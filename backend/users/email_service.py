import os
import requests

BREVO_API_KEY=os.getenv("BREVO_API_KEY")

def send_otp_email(to_email, otp):
    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    data = {
        "sender": {
            "name": "Connectly",
            "email": "sharonzane798@gmail.com"
        },
        "to": [
            {"email": to_email}
        ],
        "subject": "Your OTP Code",
        "htmlContent": f"""
            <h2>Your OTP Code</h2>
            <p>Your verification code is:</p>
            <h1>{otp}</h1>
            <p>This code expires in 5 minutes.</p>
        """
    }

    response = requests.post(url, headers=headers, json=data)
    return response.json()
