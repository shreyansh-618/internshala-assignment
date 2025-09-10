// Standardized API response utilities
export const successResponse = (
  data,
  message = "Success",
  statusCode = 200
) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode,
  };
};

export const errorResponse = (
  message = "Error",
  statusCode = 500,
  details = null
) => {
  return {
    success: false,
    message,
    error: details,
    timestamp: new Date().toISOString(),
    statusCode,
  };
};

export const paginationResponse = (data, pagination, message = "Success") => {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };
};
