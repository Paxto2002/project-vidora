// src/utils/apiResponse.js

class apiResponse {
  constructor(
    statusCode,
    data,
    message = "Request was successful",
    success = true
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode >= 200 && statusCode < 400 ? success : false;
  }
}
