const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // Fetch the user's `sub` from the Lambda authorizer
        const userID = event.requestContext.authorizer.claims.sub;

        const role = await getRoleFromDynamoDB(userID);

        const userInput = event.prompt || "Hello, GPT-4!";
        const constructedPrompt = role
            ? `system: I'm your ${role}.\nuser: ${userInput}`
            : `user: ${userInput}`;

        const response = await callOpenAI(constructedPrompt); // Assuming you have this function defined elsewhere
        const content = response.data.choices[0].text.trim();

        return returnLambdaResponse(200, { message: content });
    } catch (error) {
        console.error("Error:", error);
        return returnLambdaResponse(500, { error: "Internal server error" });
    }
};

async function getRoleFromDynamoDB(userID) {
    const params = {
        TableName: "YourDynamoDBTableName",
        Key: {
            UserID: userID,
        },
    };
    const result = await DynamoDB.get(params).promise();
    return result.Item ? result.Item.Role : null;
}

function returnLambdaResponse(status, content) {
    const response = {
        statusCode: status,
        headers: {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        body: JSON.stringify(content),
    };

    return response;
}
