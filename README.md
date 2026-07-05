# Postman Lite

A browser-based lightweight API client for sending GET, POST, PUT,
and DELETE requests, managing headers and query params, viewing pretty
responses, and saving requests into collections.

## Live Links

- GitHub Repository: [fazal305/postman-lite](https://github.com/fazal305/postman-lite)
- Live Demo: [https://fazal305.github.io/postman-lite/](https://fazal305.github.io/postman-lite/)

## Overview

Postman Lite is a lightweight browser-based API client built for frontend portfolio use. It lets users compose HTTP requests, manage headers and query parameters, validate JSON bodies, inspect formatted responses, and save reusable requests into local collections.

The app runs without a build step and can be opened directly from `index.html`, making it easy to host with GitHub Pages or run locally.

## Features

- Send GET, POST, PUT, and DELETE requests
- Build requests with custom URLs
- Add and remove request headers
- Add and remove query parameters
- Validate JSON request bodies
- Pretty-print JSON API responses
- View raw response output
- Display response status, time, size, and content type
- Copy the latest response to the clipboard
- Download the latest response as JSON
- Create request collections
- Save requests into collections
- Load and delete saved requests
- Search saved requests by name, method, URL, or collection
- Persist saved data with localStorage
- Export saved collections as JSON
- Responsive cyberpunk developer-tool interface

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Fetch API
- LocalStorage
- URLSearchParams
- JSON.parse
- JSON.stringify
- Blob API
- Clipboard API

## Learning Outcomes

- Practiced building a complete browser-only developer tool
- Used the Fetch API with async/await for HTTP workflows
- Managed request state without a frontend framework
- Validated JSON input with JSON.parse
- Rendered pretty JSON using JSON.stringify
- Built dynamic editors for headers and query parameters
- Stored saved requests and collections in localStorage
- Created export/download behavior with Blob and URL.createObjectURL
- Used the Clipboard API for response copying
- Designed a responsive Bootstrap-based interface

## Folder Structure

```text
postman-lite/
  index.html
  styles.css
  script.js
  README.md
  LICENSE
  .gitignore
```
How To Run Locally
git clone https://github.com/fazal305/postman-lite.git
cd postman-lite
Open index.html directly in your browser.
How To Use
Select an HTTP method: GET, POST, PUT, or DELETE.
Enter a full request URL, including https://.
Add optional headers in the Headers section.
Add optional query parameters in the Query Parameters section.
For POST or PUT requests, enter a valid JSON body.
Click Validate JSON Body if you want to check the body before sending.
Click Send Request.
Review the status, time, size, content type, pretty response, and raw response.
Create a collection from the Collections panel.
Click Save Request to store the current request in the selected collection.
Use Saved Requests to search, load, or delete saved requests.
Use Export Collection to download saved collections as JSON.
Sample Requests
GET Post
GET https://jsonplaceholder.typicode.com/posts/1
GET Users
GET https://jsonplaceholder.typicode.com/users
POST Post
POST https://jsonplaceholder.typicode.com/posts
{
  "title": "Postman Lite Test",
  "body": "This is a sample API request body.",
  "userId": 1
}