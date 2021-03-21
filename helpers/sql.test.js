const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForQueryFilters } = require("./sql");

describe("turn input into sql-friendly string", () => {
  // update query tests
  test("should handle good input", () => {
    const input = { firstName: "jimmy", lastName: "james" };
    formatter = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };
    try {
      const results = sqlForPartialUpdate(input, formatter);
      expect(results.setCols).toContain('"first_name"=$1', '"last_name"=$2');
      expect(results.values).toContain("jimmy", "james");
    } catch (err) {
      return next(err);
    }
  });
  test("should handle no input", () => {
    const input = {};
    formatter = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };
    try {
      const results = sqlForPartialUpdate(input, formatter);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  // filter query tests
  test("should handle 1 filter", () => {
    const input = { name: "bro" };
    const results = sqlForQueryFilters(input);
    expect(results).toContain("LOWER(name) LIKE '%bro%'");
  });
  test("should handle mulitple filters", () => {
    const input = { name: "bro", minEmployees: 100 };
    const results = sqlForQueryFilters(input);
    expect(results).toContain(
      "LOWER(name) LIKE '%bro%' AND num_employees > 100"
    );
  });
  test('should handle bad filters', () => {
    const input = { potatoes: 50, minEmployees: 100 };
    try {
      const results = sqlForQueryFilters(input);
    } catch (err) {
      expect(err.message).toContain("Invalid Filter potatoes");
    }
  })
  
  test("should throw error if min > max", () => {
    const input = { maxEmployees: 50, minEmployees: 100 };
    try {
      const results = sqlForQueryFilters(input);
    } catch (err) {
      expect(err.message).toContain("Max must be greater than min.");
    }
  });
  test("should throw error if min = max", () => {
    const input = { maxEmployees: 50, minEmployees: 50 };
    try {
      const results = sqlForQueryFilters(input);
    } catch (err) {
      expect(err.message).toContain("Max and min can not be equal.");
    }
  });
});
