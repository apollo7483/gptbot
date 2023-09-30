const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // Fetch the Cognito user's sub from the request's context
        const userID = event.requestContext.authorizer.claims.sub;

        const role = await getRole(userID);

        if (role) {
            return returnLambdaResponse(200, { role: role });
        } else {
            return returnLambdaResponse(404, {
                error: "Role not found for the given user",
            });
        }
    } catch (error) {
        console.error("Error fetching role:", error);
        return returnLambdaResponse(500, { error: "Internal server error" });
    }
};

async function getRole(userID) {
    const params = {
        TableName: "UserRoles",
        Key: {
            userID: userID,
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
