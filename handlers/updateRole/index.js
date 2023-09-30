const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const userID = event.requestContext.authorizer.claims.sub;

    switch (event.action) {
        case "addOrUpdate":
            return await addOrUpdateRole(userID, event.role);
        case "get":
            return await getRole(userID);
        case "delete":
            return await deleteRole(userID);
        default:
            return returnLambdaResponse(400, { error: "Invalid action" });
    }
};

async function addOrUpdateRole(userID, role) {
    const params = {
        TableName: "UserRoles",
        Key: {
            UserID: userID,
        },
        UpdateExpression: "set Role = :r",
        ExpressionAttributeValues: {
            ":r": role,
        },
    };

    try {
        await DynamoDB.update(params).promise();
        return returnLambdaResponse(200, {
            message: "Role added or updated successfully",
        });
    } catch (error) {
        return returnLambdaResponse(500, {
            error: "Error adding or updating role",
        });
    }
}

async function getRole(userID) {
    const params = {
        TableName: "UserRoles",
        Key: {
            UserID: userID,
        },
    };

    try {
        const result = await DynamoDB.get(params).promise();
        return returnLambdaResponse(200, result.Item);
    } catch (error) {
        return returnLambdaResponse(500, { error: "Error fetching role" });
    }
}

async function deleteRole(userID) {
    const params = {
        TableName: "UserRoles",
        Key: {
            UserID: userID,
        },
    };

    try {
        await DynamoDB.delete(params).promise();
        return returnLambdaResponse(200, {
            message: "Role deleted successfully",
        });
    } catch (error) {
        return returnLambdaResponse(500, { error: "Error deleting role" });
    }
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
