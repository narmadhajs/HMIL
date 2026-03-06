import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
import ssl
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.username = os.getenv("GMAIL_ADDRESS")
        self.password = os.getenv("GMAIL_PASSWORD")
        
        templates_dir = Path(__file__).parent / "templates"
        templates_dir.mkdir(exist_ok=True)
        self.env = Environment(loader=FileSystemLoader(templates_dir))
    
    def _create_smtp_connection(self):
        context = ssl.create_default_context()
        server = smtplib.SMTP(self.smtp_server, self.smtp_port)
        server.starttls(context=context)
        server.login(self.username, self.password)
        return server
    
    def send_html_email(self, recipient: str, subject: str, html_content: str) -> dict:
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"HMIL Hall Booking <{self.username}>"
            message["To"] = recipient
            
            message.attach(MIMEText(html_content, "html", "utf-8"))
            
            with self._create_smtp_connection() as server:
                server.sendmail(self.username, [recipient], message.as_string())
            
            return {"status": "success", "message": "Email sent successfully"}
        except Exception as e:
            print(f"Email error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def send_password_creation_email(self, recipient: str, token: str) -> dict:
        app_url = os.getenv("APP_URL", "http://localhost:3000")
        reset_url = f"{app_url}/create-password/{token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
                .header {{ color: #002C5F; text-align: center; }}
                .button {{ background-color: #002C5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">Welcome to HMIL Hall Booking System</h1>
                <p>Hello,</p>
                <p>Your employee account has been verified. Click the button below to create your password:</p>
                <a href="{reset_url}" class="button">Create Password</a>
                <p>Or copy this link: {reset_url}</p>
                <p>This link will expire in 1 hour for security reasons.</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_html_email(recipient, "Create Your Password - HMIL Hall Booking", html_content)
    
    def send_password_reset_email(self, recipient: str, token: str) -> dict:
        app_url = os.getenv("APP_URL", "http://localhost:3000")
        reset_url = f"{app_url}/reset-password/{token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
                .header {{ color: #002C5F; text-align: center; }}
                .button {{ background-color: #002C5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">Password Reset Request</h1>
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button below to proceed:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>Or copy this link: {reset_url}</p>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_html_email(recipient, "Password Reset - HMIL Hall Booking", html_content)
    
    def send_booking_notification(self, recipient: str, booking_data: dict, notification_type: str) -> dict:
        if notification_type == "submitted":
            subject = "Booking Request Submitted"
            message = f"Your booking request for {booking_data['hall_name']} on {booking_data['date']} ({booking_data['slot']}) has been submitted successfully."
        elif notification_type == "approved":
            subject = "Booking Request Approved"
            message = f"Your booking request for {booking_data['hall_name']} on {booking_data['date']} ({booking_data['slot']}) has been approved."
        elif notification_type == "rejected":
            subject = "Booking Request Rejected"
            message = f"Your booking request for {booking_data['hall_name']} on {booking_data['date']} ({booking_data['slot']}) has been rejected."
        elif notification_type == "modified":
            subject = "Booking Modified by Admin"
            message = f"Your booking has been modified by admin. New details: {booking_data['hall_name']} on {booking_data['date']} ({booking_data['slot']})."
        else:
            subject = "Booking Update"
            message = "Your booking has been updated."
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
                .header {{ color: #002C5F; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">{subject}</h1>
                <p>{message}</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li>Hall: {booking_data.get('hall_name', 'N/A')}</li>
                    <li>Date: {booking_data.get('date', 'N/A')}</li>
                    <li>Time Slot: {booking_data.get('slot', 'N/A')}</li>
                    <li>Purpose: {booking_data.get('purpose', 'N/A')}</li>
                </ul>
            </div>
        </body>
        </html>
        """
        
        return self.send_html_email(recipient, subject, html_content)

email_service = EmailService()