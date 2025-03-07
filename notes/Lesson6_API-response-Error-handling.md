## Custom api response and error handling
Custom error handling is a technique used to manage errors consistently and effectively throughout an application. It ensures that errors are caught, handled, and addressed in a structured way, preventing them from affecting the user experience or causing unexpected behavior.

### Benefits of Custom Error Handling

1. **Catches all errors (local and global)**: Ensures that all types of errors, whether local or global, are caught and handled in one place.
   
2. **Prevents errors from leaking**: Stops errors from propagating and affecting other parts of the system or leaking to users.
   
3. **Reusability**: Write error-handling logic once and reuse it across different parts of the application.
   
4. **Clean and avoids duplication**: Centralizes error handling, reducing repetitive error-checking code and keeping the codebase clean and maintainable.

### Why is Custom Error Handling Important?

- **Consistency**: Provides a consistent approach to handle errors across the application.
- **Efficiency**: Saves time by streamlining how errors are managed.
- **Reliability**: Ensures your app is robust and resilient to issues, preventing unexpected crashes and bugs.


### UTILS FOLDER 📁

#### 1. Create asyncHandler.js
We will create an `asyncHandler` that handles asynchronous code in Express using either `Promise` or `try-catch`.

- With `Promise`
```javascript
  const asyncHandler = (reqestHandler) => {
    return (req, res, next) => {
      Promise.resolve(reqestHandler(req, res, next)).catch((err) => next(err))
    }
  }

  export {asyncHandler}

```
### Explanation(`Promise`):

1. **Arrow Function**:
   - `asyncHandler` is an arrow function that takes `requestHandler` as an argument.
   - The `requestHandler` is the asynchronous function that will be executed.

2. **Parameters**:
   - `req`: The request object.
   - `res`: The response object.
   - `next`: The next middleware function (used if an error occurs).

3. **Promise Handling**:
   - `Promise.resolve(requestHandler(req, res, next))`: Ensures that the `requestHandler` returns a resolved promise, whether it's asynchronous or not.
   - `.catch((err) => next(err))`: If an error occurs, it is passed to the next middleware using `next(err)`.

4. **Export**:
   - The `asyncHandler` function is exported for use in other parts of your application.

- With `tryCatch`

```javascript
  const asyncHandler = (func) => async(req, res, next) => {
    try {
      await func(req, req, next)
    } catch (error) {
      res.status(error.code || 500).json({
        success : false,
        message: error.message
      })
    }
  }
```
### Explanation(`tryCatch`)

1. **Function Execution**:
   - `asyncHandler` takes an async function (`func`) and returns a new async function that wraps it.

2. **Error Handling**:
   - It tries to run the async function (`await func(req, res, next)`).
   - If any error occurs, it catches it in the `catch` block.

3. **Error Response**:
   - The error response is sent with a `500` status code (or the custom error code) and a message.

4. **Usage**:
   - The handler ensures that any errors from the async function are caught and returned as a structured JSON response.



### Key Points:
- **Promise version**: Handles asynchronous functions and passes errors to the next middleware.
- **Try-catch version**: Handles async functions with error responses directly in the `catch` block.


#### 2. Create ApiResponse.js
The `ApiResponse` class is used to structure API responses with a consistent format.

```javascript
  class ApiResponse {
    constructor(
      statusCode, data, message = "SUCCESS"
    )
    {
      this.statusCode = statusCode;  // HTTP status code (e.g., 200, 404)
      this.data = data;              // The response data
      this.message = message;        // Optional message (default: "SUCCESS")
      this.success = statusCode
    }
  }


  export {ApiResponse}
  ```
### Explanation of `ApiResponse`
- statusCode: Represents the HTTP status code (e.g., 200 for success or 404 for not found).
- data: Contains the data or content returned by the API.
- message: An optional message providing more info (defaults to "SUCCESS").
- success: A boolean that checks if the response is successful based on the status code. If the code is between 200 and 299, it’s true; otherwise, false.


#### 3. Create ApiError.js
The `ApiError` class is used to handle errors in your API with custom messages, status codes, and optional error details.

```javascript
  class ApiError extends Error {
    constructor(
      statusCode,
      message = "Something went wrong",
      errors = [],
      stack = ""
    ){
      super(message)
      this.statusCode = statusCode
      this.data = null
      this.message = message
      this.success = this.success
      this.errors = errors

      if(stack) {
        this.stack = stack
      }
      else {
        Error.captureStaackTrace(this, this.constructor)
      }
    }
  }


  export {ApiError}
```
### Explanation

- **super(message)**: Calls the parent Error class constructor to set the message, which overrides the default error message.
- **statusCode**: The HTTP error code (like `404` for "Not Found").
- **message**: The error message (default is `"Something went wrong"`).
- **success**: Always `false` because it's an error response.
- **errors**: An optional list of extra details about the error.
- **stack**: Tracks where the error happened. It can be custom or auto-generated.
