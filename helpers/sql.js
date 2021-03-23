const { BadRequestError, ExpressError } = require("../expressError");

const companyFilterCodes = ["name", "minEmployees", "maxEmployees"];
const jobFilterCodes = ["title", "minSalary", "hasEquity"];
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

function sqlForCompanyQueryFilters(filters) {
  const keys = Object.keys(filters);
  for (key of keys) {
    if (companyFilterCodes.indexOf(key) === -1) {
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

/** Takes in an object of filters, returns a string 
  containing a formatted WHERE clause.
  EX: filters = {title: "pro", salary=40000}
  
  >>> LOWER(title) LIKE '%pro%' AND salary > 40000
  Throws an error if a filter is invalid.
 */

function sqlForJobQueryFilters(filters) {
  const keys = Object.keys(filters);
  for (key of keys) {
    if (jobFilterCodes.indexOf(key) === -1) {
      throw new ExpressError(`Invalid Filter ${key}`, 500);
    }
  }
  // just one filter
  let whereClause = "";
  if (keys.length === 1) {
    if (keys[0] === "title") {
      whereClause += `LOWER(title) LIKE '%${filters.title.toLowerCase()}%'`;
    } else if (keys[0] === "minSalary") {
      whereClause += `salary >= ${filters.minSalary}`;
    } else if (keys[0] === "hasEquity") {
      whereClause += `equity > 0`;
    }
    return whereClause;
  } else {
    // mulitple filters
    let clauses = [];
    for (let key of keys) {
      if (key === "title") {
        titleClause = ` LOWER(title) LIKE '%${filters.title.toLowerCase()}%'`;
        clauses.push(titleClause);
      } else if (key === "minSalary") {
        minClause = ` salary >= ${filters.minSalary}`;
        clauses.push(minClause);
      } else if (key === "hasEquity") {
        equityClause = ` equity > 0`;
        clauses.push(equityClause);
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
  } else if (filters.minEmployees === filters.maxEmployees) {
    throw new ExpressError("Max and min can not be equal.", 400);
  } else {
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

module.exports = {
  sqlForPartialUpdate,
  sqlForCompanyQueryFilters,
  sqlForJobQueryFilters,
};
