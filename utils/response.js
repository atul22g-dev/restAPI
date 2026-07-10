/**
 * Consistent API response helpers
 */
class ApiResponse {
  /**
   * Send success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      status: 'success',
      message,
    };
    if (data !== null) {
      response.data = data;
    }
    return res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   */
  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  static noContent(res) {
    return res.status(204).end();
  }
}

module.exports = ApiResponse;
