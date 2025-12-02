// FILE: routes/contact.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const nodemailer = require('nodemailer');

// GET contact page
router.get('/', (req, res) => {
    res.render('contact', { 
        page: 'contact', 
        pageStyles: '<link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/contact.css">'
    });
});

// POST contact form
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    console.log("\n===== NEW CONTACT FORM SUBMISSION =====");
    console.log("Form data received:", req.body);

    // Save to database
    db.run(
        `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`,
        [name, email, message],
        (err) => {
            if (err) console.error("DB ERROR:", err);
            else console.log("Saved to database.");
        }
    );

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: subject || "New Portfolio Message",
            text: message,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Message:</strong><br>${message}</p>`
        });

        console.log("Email SENT! Message ID:", info.messageId);

        // Success page with "Send another message" link
        res.send(`
            <div style="text-align:center; padding:50px;">
                <h2 style="color:#4CAF50;">Message sent successfully!</h2>
                <p>Thank you, ${name}. I will get back to you shortly.</p>
                <a href="/contact" style="color:#F6D1C1; text-decoration:underline; font-weight:bold;">Send another message</a>
            </div>
        `);

    } catch (error) {
        console.error("Email sending ERROR:", error);
        res.send(`
            <div style="text-align:center; padding:50px;">
                <h2 style="color:red;">Email failed</h2>
                <p>Check the terminal for error details.</p>
                <a href="/contact" style="color:#F6D1C1; text-decoration:underline; font-weight:bold;">Try again</a>
            </div>
        `);
    }
});

module.exports = router;
