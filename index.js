var sqlite = require('sqlite3').verbose(),
    self_name = 'sqlite3-wrapper'

module.exports.open = function(databaseName) {

    var db = new sqlite.Database(databaseName)
    if (db === undefined) {
        return db
    }

    db.logQueries = false;

// Select expects param to be either a string 
// (e.g. "select * from table"), or an object with properties:
//   .table: string, table name
//   .fields (optional): string or array of strings - fields to return
//   .limit (optional): integer, maximum number of records to return
//   .offset (optional): integer, number of records to skip
//   .order (optional): string, e.g. "name desc"
//   .where (optional): where clause object:
//      Two cases of where object: 
//      1) an object with keys for field names and values for field values, 
//         e.g. {name: "John"}
//      2) an object with properties:
//         .clause with a query string (e.g. "name like ? OR surname like ?"), 
//         .params with parameter values
db.select = function(params, cb) {

    var tableString  = '',
        whereObj = {},
        queryParams = [],
        fieldsString = '',
        limitString  = '',
        offsetString = '',
        orderString  = '',
        queryString  = ''

    if (typeof params === 'string') {
        queryString = params
    } else if (typeof params === 'object') {
        tableString = safeName(params.table || '');
        if (tableString === '') {
            callError(cb, 'select', 'Table is not specified ')
            return
        }
        fieldsString = (Object.prototype.toString.call(params.fields) === '[object Array]' ? params.fields.join(', ') : params.fields) || '*'
        whereObj = makeWhereStringAndParams(params.where || '')
        limitString = (params.limit && ' limit ' + params.limit) || ''
        offsetString = (params.offset && ' offset ' + params.offset) || ''
        orderString = (params.order && ' order by ' + params.order) || ''
        queryString = 'select ' + fieldsString + ' from ' + tableString + whereObj.string + orderString + limitString + offsetString
        queryParams = whereObj.params
    } else {
        callError(cb, 'select', 'First argument in select must be either a string or an object')
        return
    }

    if (db.logQueries) console.log(queryString, queryParams)
    db.all(queryString, queryParams, cb)
}

db.insert = function(table, record, cb) {
    var queryString = '',
        tableString = '',
        fields = [],
        fieldsValues = [],
        queryParams = [],
        recordObj = record || {},
        k

    tableString = safeName(table);
    for (k in recordObj)  {
        fields.push(k)
        fieldsValues.push('?')
        queryParams.push(convertValue(record[k]))
    }
    queryString = 'insert into ' + tableString + ' (' +  fields.join(', ') + ') values (' + fieldsValues.join(', ') + ')'

    if (db.logQueries) console.log(queryString, queryParams)
    db.run(queryString, queryParams, function(error){
        if (cb) cb(error, this.lastID)
    })
}

db.update = function(table, changes, arg3, arg4) {
    var changesObj = changes || {},
        queryString = '',
        tableString = safeName(table),
        where = arg3, whereObj,
        cb = arg4,
        fields = [],
        queryParams = [],
        k

    if (typeof arg3 === 'function') { cb = arg3; where = undefined; }

    if (tableString === undefined) {
        callError(cb, 'update', 'table is undefined')
        return
    }

    for (k in changesObj) {
        fields.push(k + ' = ?')
        queryParams.push(convertValue(changesObj[k]))
    }

    if (fields.length === 0) {
        callError(cb, 'update', 'no fields to update')
        return;
    }

    whereObj = makeWhereStringAndParams(where)
    queryParams = queryParams.concat(whereObj.params)
    queryString = 'update ' + tableString + ' set ' + fields.join(', ') + whereObj.string

    if (db.logQueries) console.log(queryString, queryParams)
    db.run(queryString, queryParams, function(error) {
        if (cb) cb(error, this.changes)
    });
}

db.delete = function(table, where, cb) {
    var tableString = safeName(table),
        whereObj = makeWhereStringAndParams(where),
        queryString = ''

    if (tableString === undefined) {
        callError(cb, 'delete', 'table is undefined')
        return
    }

    queryString = 'delete from ' + tableString + whereObj.string
    if (db.logQueries) console.log(queryString, whereObj.params)
    db.run(queryString, whereObj.params, function(error) {
        if (cb) cb(error, this.changes)
    })
}


return db
}


function callError(cb,func,msg){
    var err = '[' + self_name + '.' + func + ']: ' + msg
    console.error(err)
    if (cb) cb(err, undefined)
}

function safeName(name) {
    return ((name || '').match(/[a-zA-Z0-9_]+/) || [])[0]
}

function convertValue(value) {
  if (typeof value === 'object' && value !== null) {
    if (angular) return angular.toJson(value);
    return JSON.stringify(value);
  } else
    return value;
}

// Converts where clause object to where.string and where.params to use in query
function makeWhereStringAndParams(where) {
    var whereObj = where || {},
        result = {string: '', params: []},
        fields = [],
        k

    // Two cases of where object: 
    // 1) simple where object with keys for field names and values for field values
    // 2) .clause with a query string (e.g. "name like ? OR surname like ?"), .params with parameter values
    if (whereObj.clause && whereObj.clause.length > 0) {
        result.string = ' where ' + whereObj.clause
        result.params = whereObj.params || []
    } else {
        for (k in whereObj) {
            if (whereObj[k] instanceof Array) {
                var first = whereObj[k][0]
                if (typeof first === 'string' || first instanceof String) {
                    fields.push(k + ' IN ("' + whereObj[k].join('","') + '")')
                } else {
                    fields.push(k + ' IN (' + whereObj[k].join(',') + ')')
                }
            } else {
                fields.push(k + ' = ?')
                result.params.push(whereObj[k])
            }
        }
        if (fields.length > 0) {
            result.string = ' where ' + fields.join(' and ')
        }
    }
    return result
}
