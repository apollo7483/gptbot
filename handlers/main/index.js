const AWS = require("aws-sdk");
const OpenAI = require("openai");
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Authorization,Content-Type",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            body: "",
        };
    }

    if (event.httpMethod !== "POST") {
        throw new Error(`Method not allowed`);
    }

    const body = JSON.parse(event.body);
    const userRole = body.role;

    if (!userRole) {
        throw new Error("Role is required");
    }

    const apiKey = await getApiKeyFromSecretsManager(process.env.SECRET_NAME);
    const openai = new OpenAI({
        apiKey: apiKey,
    });

    const messages = [
        { role: "system", content: "短く簡潔に" },
        { role: "system", content: userRole },
        { role: "user", content: body.message },
    ];

    let responseMessage;

    try {
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
            max_tokens: 300,
        });
        responseMessage = completion.choices[0].message.content;
        console.log(responseMessage);
    } catch (error) {
        console.error("Error:", error.message); // Detailed error logged for diagnostic purposes

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Authorization,Content-Type",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            body: JSON.stringify({
                message: "An error occurred. Please try again later.",
            }),
        };
    }

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*", // This allows any origin
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS", // Adding OPTIONS for preflight requests
        },
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
            return JSON.parse(secret.SecretString).key;
        }
    } catch (err) {
        console.error(err);
        throw new Error("Error fetching API Key from Secrets Manager");
    }
};
