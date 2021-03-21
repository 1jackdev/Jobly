const { BadRequestError, ExpressError } = require("../expressError");

const filterCodes = ["name", "minEmployees", "maxEmployees"];
/** If supplied with data, converts the data format
  from an object to a sql-friendly array.
  accepts a second arg jsToSql which should look similar 
  to this:
  {firstName: "first_name",lastName: "last_name"}
  returns an object of the formatted array and the 
  original data values.
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Takes in an object of filters, returns a string 
  containing a formatted WHERE clause.
  EX: filters = {name: "bro", minEmployees=200}
  
  >>> LOWER(name) LIKE '%bro%' AND num_employees > 200
  Throws an error if a filter is invalid.
 */

function sqlForQueryFilters(filters) {
  const keys = Object.keys(filters);
  for (key of keys) {
    if (filterCodes.indexOf(key) === -1) {
      throw new ExpressError(`Invalid Filter ${key}`, 500);
    }
  }
  // just one filter
  let whereClause = "";
  if (keys.length === 1) {
    if (keys[0] === "name") {
      whereClause += `LOWER(name) LIKE '%${filters.name.toLowerCase()}%'`;
    } else if (keys[0] === "minEmployees") {
      whereClause += `num_employees > ${filters.minEmployees}`;
    } else if (keys[0] === "maxEmployees") {
      whereClause += `num_employees > ${filters.maxEmployees}`;
    }
    return whereClause;
  } else {
    // mulitple filters
    minMaxEmployeesCheck(filters);
    let clauses = [];
    for (let key of keys) {
      if (key === "name") {
        nameClause = ` LOWER(name) LIKE '%${filters.name.toLowerCase()}%'`;
        clauses.push(nameClause);
      } else if (key === "minEmployees") {
        minClause = ` num_employees > ${filters.minEmployees}`;
        clauses.push(minClause);
      } else if (key === "maxEmployees") {
        maxClause = ` num_employees < ${filters.maxEmployees}`;
        clauses.push(maxClause);
      }
    }
    // add each filter to the whereClause
    whereClause = concatClauses(clauses);

    return whereClause;
  }
}

/** Makes sure that the min filter 
  is smaller than max filter, and that they are not equal.
  */
function minMaxEmployeesCheck(filters) {
  if (!filters.minEmployees && filters.maxEmployees) {
    return;
  } else if (filters.minEmployees === filters.maxEmployees){
    throw new ExpressError("Max and min can not be equal.", 400);
  }
   else {
    if (filters.minEmployees > filters.maxEmployees)
      throw new ExpressError("Max must be greater than min.", 400);
  }
  return;
}

/** concatenates clauses and adds 'AND' where necessary */
function concatClauses(clauses) {
  let whereClause = "";
  for (let clause of clauses) {
    if (clauses.indexOf(clause) !== clauses.length - 1) {
      whereClause += clause + " AND";
    } else {
      whereClause += clause;
    }
  }
  return whereClause;
}

module.exports = { sqlForPartialUpdate, sqlForQueryFilters };
