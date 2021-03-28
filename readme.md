# Jobly Backend

This is the Express backend for Jobly, version 2.

To run this:

    node server.js
    
To run the tests inline :

    jest -i




## Get Started

```js
cd jobly
npm install
npm run seed # sets up the regular and test databases
npm test  # runs jest
npm start  # runs server using node command; npm run dev to use nodemon
```


Once started, use an API testing tool like Postman, Insomnia, etc.


## Features

register - this is where users sign up (returns a token):

auth/register

```JSON
{
"username": "new_user",
"password": "new_password",
"firstName": "new_first",
"lastName": "new_last",
"email": "new@newuser.com"
}
```
\
login (returns a token):

auth/token
```JSON
{
"username": "u1",
"password": "pwd1",
}
```
\

Auth token required all /user routes, some /companies routes, and some /jobs routes. 

User auth:
- Creating users should only permitted by admins (registration, however, should remain open to everyone). 
- Getting the list of all users should only be permitted by admins. 
- Getting information on a user, updating, or deleting a user should only be permitted either by an admin, or by that user. 

Company auth:
- Retrieving the list of companies or information about a company should remain open to everyone, including anonymous users. 
- Creating, updating, and deleting companies should only be possible for users who logged in with an account that has the is_admin flag in the database.

Job auth:
- Same as Company auth


GET, POST /users \
POST /companies \
POST /jobs 

```JSON
Headers:

Authorization: Bearer (your token here)

```
