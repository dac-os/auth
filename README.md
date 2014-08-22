# dacos-auth v0.0.1

autenticação do sistema da diretoria academica DAC

- [profile](#profile)
	- [Creates a new profile.](#creates-a-new-profile.)
	- [Get profile information.](#get-profile-information.)
	- [List all system profiles.](#list-all-system-profiles.)
	- [Removes profile.](#removes-profile.)
	- [Updates profile information.](#updates-profile-information.)
	


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

	POST /profiles


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

	POST /profiles

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

