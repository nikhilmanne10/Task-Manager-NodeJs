const SibApiV3Sdk = require('sib-api-v3-sdk');

// Authenticate with your API key from environment variable
SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = (process.env.apiKey);

// Create an instance of the transactional email API
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Function to send welcome email when a user signs up
const sendwelcomemail = (email, name) => {
  const sendSmtpEmail = {
    sender: { name: "Nikhil", email: "manneniki2002@gmail.com" }, // Sender details
    to: [{ email: email, name: name }], // Recipient details
    subject: "Thanks for joining in!", // Email subject line
    textContent: `Welcome to the app, ${name}. Let me know how you get along with the app.`, // Email body content
  };

  // Send the email
  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    (data) => console.log("Welcome email sent:", data),
    (error) => console.error("Error sending welcome email:", error)
  );
};

// Function to send exit email when a user deletes their account
const sendexitmail = (email, name) => {
  const sendSmtpEmail = {
    sender: { name: "Nikhil", email: "manneniki2002@gmail.com" }, // Sender details
    to: [{ email: email, name: name }], // Recipient details
    subject: "Sorry to see you go", // Email subject line
    textContent: `Goodbye, ${name}. We're sad to see you leave. Let us know if we can improve!`, // Email body content
  };

  // Send the email
  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    (data) => console.log("Exit email sent:", data),
    (error) => console.error("Error sending exit email:", error)
  );
};

// Export the functions to be used in other files
module.exports = {
  sendwelcomemail,
  sendexitmail
};
