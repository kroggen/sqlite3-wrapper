# sqlite3-wrapper

[![NPM](https://nodei.co/npm/sqlite3-wrapper.png?downloads=true)](https://nodei.co/npm/sqlite3-wrapper/)

## Features

As you know, it is much easier to work with database using objects instead of string queries:
no typos in queries, easy to get, update and write back data, 
to say nothing about getting user data from front-end forms and saving it to the database.

`sqlite3-wrapper` is built around `sqlite3` package and provides four functions to work with data: 
`select`, `insert`, `update` and `delete`. 

## Usage

First, connect to a database:

```javascript
var db = require('sqlite3-wrapper').open('./database.sqlite')

// select * from users where username = "John"
db.select({table: 'users', where: {username: 'John'}}, function(err, users) {

    if ((users || []).length > 0) {
    
        // update users set password = "12345" where id = <user.id>
        db.update('users', {password: '12345'}, {id: users[0].id}, function(error, changes) {
            // error: sqlite3 error, 
            // changes: number of rows updated (if any)
        })
    } else {
        
        // insert into users (username, password) values ("John", "12345")
        db.insert('users', {username: 'John', password: '12345'}, function(error, id) {
            // error: sqlite3 error
            // id: id of the created row
        })
    }

})

```

This wrapper extends the `db` object returned by `sqlite3`.

To see the queries that `sqlite3-wrapper` produces, set `db.logQueries = true`: queries and parameters will be logged to the console.

## where

`where` clause is an object, too. It has two forms:

1. Keys for table field names, values for field values. e. g. `{ parentId: 8341, isLeaf: 1 }`
2. Where clause (string) and params array: `{ clause: "where parentId = ? and isLeaf = ?", params: [8341, 1] }`

Examples above effectively become `where parentId = 8341 and isLeaf = 1`

When the value is an array, like this: `{ tags: ['coding','database'], idGroup: [13,15,17] }`

It will generate a IN clause: `WHERE tags IN ("coding","database") AND idGroup IN (13,15,17)`

## select(query, callback)

- **query**: an object, possible properties:
    - **table** (required, string): table name
    - **fields** (optional, string or array of strings): fields to return, e. g. ["title", "price"]
    - **limit** (optional, integer): maximum number of records to return
    - **offset** (optional, integer): number of records to skip
    - **order** (optional, string): order, e.g. "name desc"
    - **where** (optional): `where` object
    
    It is also possible to pass a query string instead of a query object: `db.select('select distinct category from records', ...)`
    
- **callback** (optional): function(error, rows)
    - **error**: `sqlite3` error
    - **rows**: array of rows that match the query

## update(table, changes, where, callback)

- **table**: table name
- **changes**: an object with fields to update and their values, e. g. `{username: "John", password: "12345"}`
- **where** (optional): `where` object
- **callback** (optional): function(error, changes)
    - **error**: `sqlite3` error
    - **changes**: number of rows changed
    
## insert(table, row, callback)
- **table**: table name
- **row**: an object to insert to the database, e. g. `{username: "John", password: "12345"}`
- **callback** (optional): function(error, id)
    - **error**: `sqlite3` error
    - **id**: id of the new row created, 0 if error
    
## delete(table, where, callback)
- **table**: table name
- **where**: `where` object
- **callback** (optional): function(error, changes)
    - **error**: `sqlite3` error
    - **changes**: number of rows deleted
