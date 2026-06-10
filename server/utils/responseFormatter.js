// Consistent API response format utility
const successResponse = (res, data, message = null, statusCode = 200) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
};

const errorResponse = (res, error, code = 'ERROR', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
  });
};

module.exports = { successResponse, paginatedResponse, errorResponse };
