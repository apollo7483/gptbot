const axios = require("axios");
const AWS = require("aws-sdk");
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        throw new Error(`Method not allowed`);
    }

    // Parse the body of the request
    const body = JSON.parse(event.body);

    // Extract the user role from the request body
    const userRole = body.role;

    // Check the API Key from Secrets Manager
    const apiKey = await getApiKeyFromSecretsManager(process.env.SECRET_NAME);

    // If the role is not specified, just use the message. Otherwise, append the role to the message.
    const message = userRole
        ? `${body.message} Role: ${userRole}`
        : body.message;

    let responseMessage;

    try {
        const openAIResponse = await axios.post(
            "https://api.openai.com/v2/engines/text-davinci-002/completions",
            {
                prompt: message,
                max_tokens: 150,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            },
        );

        responseMessage = openAIResponse.data.choices[0].text.trim();
    } catch (error) {
        responseMessage = "Error while contacting OpenAI";
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify({ message: responseMessage }),
    };

    return response;
};

const getApiKeyFromSecretsManager = async (name) => {
    try {
        const secret = await secretsManager
            .getSecretValue({
                SecretId: name,
            })
            .promise();

        if ("SecretString" in secret) {
            return JSON.parse(secret.SecretString).name;
        }
    } catch (err) {
        console.error(err);
        throw new Error("Error fetching API Key from Secrets Manager");
    }
};
