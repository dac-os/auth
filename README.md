# dacos-auth v0.0.1

autenticação do sistema da diretoria academica DAC

- [profile](#profile)
	- [Creates a new profile.](#creates-a-new-profile.)
	- [Get profile information.](#get-profile-information.)
	- [List all system profiles.](#list-all-system-profiles.)
	- [Removes profile.](#removes-profile.)
	- [Updates profile information.](#updates-profile-information.)
	
- [user](#user)
	- [Creates a new session.](#creates-a-new-session.)
	- [Creates a new user.](#creates-a-new-user.)
	- [Get user information.](#get-user-information.)
	- [Updates user information.](#updates-user-information.)
	


# profile

## Creates a new profile.

When creating a new profile the user must send the profile name and the profile permissions. The profile name is used
for naming and must be unique in the system. If a existing name is sent to this method, a 409 error will be raised.
And if no name is sent, a 400 error will be raised. The profile permissions consists of an array of strings
representing the actions the user can do on the system.

	POST /profiles

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| name			| String			|  Profile name.							|
| permissions			| [String]			|  List of profile permissions.							|

### Success Response

HTTP/1.1 201 Created

```
{}

```
### Error Response

HTTP/1.1 400 Bad Request

```
{
 "name": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```
## Get profile information.

This method returns a single profile details, the profile slug must be passed in the uri to identify the requested
profile. If no profile with the requested slug was found, a 404 error will be raised.

	GET /profiles/:profile


### Success Response

HTTP/1.1 200 OK

```
{
 "slug": "teacher",
 "name": "teacher",
 "permissions": [
   "changeGrades"
 ],
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
## List all system profiles.

This method returns an array with all profiles in the database. The data is returned in pages of length 20. If no
page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.

	GET /profiles

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| page			| [Number=0]			|  Requested page.							|

### Success Response

HTTP/1.1 200 OK

```
[{
 "slug": "teacher",
 "name": "teacher",
 "permissions": [
   "changeGrades"
 ],
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}]

```
## Removes profile.

This method removes a profile from the system. If no profile with the requested slug was found, a 404 error will be
raised.

	DELETE /profiles/:profile


### Success Response

HTTP/1.1 204 No Content

```
{}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
HTTP/1.1 403 Forbidden

```
{}

```
## Updates profile information.

When updating a profile the user must send the profile name and the profile permissions. If a existing name which is
not the original profile name is sent to this method, a 409 error will be raised. And if no name is sent, a 400 error
will be raised.  If no profile with the requested slug was found, a 404 error will be raised.

	PUT /profiles/:profile

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| name			| String			|  Profile name.							|
| permissions			| [String]			|  List of profile permissions.							|

### Success Response

HTTP/1.1 200 Ok

```
{}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
HTTP/1.1 400 Bad Request

```
{
 "name": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```
# user

## Creates a new session.

To create a new user session, the user must send his academic registry and password using the http basic header
"authorization", in this header the user must put the word "basic " followed by the academic registry and password
separated with ":" and encoded in base 64. If the credentials are valid, a access token will be generated.
Using the user internal id, the current timestamp and a token salt, this values will be hashed with sha1 and digested
into hex to generate a access token. This token can be used for one hour after created. To use the access token, for
every request, the user must send the access token in the "csrf-token" header.

	POST /users/me/session


### Success Response

HTTP/1.1 200 Ok

```
{
 "token": "fb952b1957b6a96debbdf418304226cd356c5499"
}

```
### Error Response

HTTP/1.1 401 Unauthorized

```
{}

```
## Creates a new user.

When creating a new user account the user must send the profile, the user academic registry and the password. The
academic registry is used for naming and must be unique in the system. If a existing academic registry is sent to
this method, a 409 error will be raised. And if no academic registry, or password or profile where sent, a 400 error
will be raised. Before saving, the user password will be hashed with sha1 together with a password salt and digested
into hex.

	POST /users

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| profile			| String			|  User's profile name.							|
| academicRegistry			| String			|  User academic registry.							|
| password			| String			|  User password..							|

### Success Response

HTTP/1.1 201 Created

```
{}

```
### Error Response

HTTP/1.1 400 Bad Request

```
{
 "academicRegistry": "required",
 "password": "required",
 "profile": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```
## Get user information.

This method returns a single user details, the user academic registry must be passed in the uri to identify th
requested user. If no user with the requested academic registry was found, a 404 error will be raised.

	GET /users/me


### Success Response

HTTP/1.1 200 OK

```
{
 "academicRegistry": "111111",
 "profile": {
   "slug": "teacher",
   "name": "teacher",
   "permissions": [
     "changeGrades"
   ],
   "createdAt": "2014-07-01T12:22:25.058Z",
   "updatedAt": "2014-07-01T12:22:25.058Z"
 },
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}

```
## Updates user information.

When updating a user account the user must send the profile, the user academic registry and the password. If a
existing academic registry which is not the original user academic registry is sent to this method, a 409 error will
be raised. And if no academic registry, or password or profile is sent, a 400 error will be raised. If no user with
the requested academic registry was found, a 404 error will be raised.

	PUT /users/me

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| profile			| String			|  User's profile name.							|
| academicRegistry			| String			|  User academic registry.							|
| password			| String			|  User password..							|

### Success Response

HTTP/1.1 200 Ok

```
{}

```
### Error Response

HTTP/1.1 400 Bad Request

```
{
 "academicRegistry": "required",
 "password": "required",
 "profile": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```

