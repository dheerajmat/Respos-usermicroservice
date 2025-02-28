import { serializeData } from "../utils/serializer.js";

const responseHandler = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
        // If the response is already formatted, send as is
        if (data && typeof data === 'object' && ('success' in data)) {
            return originalJson.call(this, serializeData(data));
        }

        // Get the status code, default to 200 if not set
        const statusCode = res.statusCode || 200;

        // Determine success based on status code
        const isSuccess = statusCode >= 200 && statusCode < 300;

        // Format the response and serialize data
        const formattedResponse = {
            success: isSuccess,
            data: serializeData(data)
        };

        return originalJson.call(this, formattedResponse);
    };

    next();
};

export default responseHandler; 