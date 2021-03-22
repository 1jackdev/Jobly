"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "gardener",
    salary: 65000,
    equity: 0.1,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "gardener",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "gardener",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "carpenter",
        salary: 30000,
        equity: "0.1",
        companyHandle: "c2",
      },
      {
        title: "gardener",
        salary: 25000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        title: "programmer",
        salary: 125000,
        equity: "0.1",
        companyHandle: "c2",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const newJob = await Job.create({
      title: "gardener",
      salary: 25000,
      equity: 0.1,
      companyHandle: "c1",
    });
    let job = await Job.get(newJob.id);
    expect(job).toEqual({
      id: newJob.id,
      title: "gardener",
      salary: 25000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Job",
  };

  test("works", async function () {
    const newJob = await Job.create({
      title: "gardener",
      salary: 25000,
      equity: 0.1,
      companyHandle: "c1",
    });
    let job = await Job.update(newJob.id, updateData);
    expect(job).toEqual({
      title: "New Job",
      salary: 25000,
      equity: "0.1",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${newJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: newJob.id,
        title: "New Job",
        salary: 25000,
        equity: "0.1",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const newJob = await Job.create({
      title: "gardener",
      salary: 25000,
      equity: 0.1,
      companyHandle: "c1",
    });
    const updateDataSetNulls = {
      title: "New New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(newJob.id, updateDataSetNulls);
    expect(job).toEqual({
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = ${newJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: newJob.id,
        title: "New New",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const newJob = await Job.create({
      title: "gardener",
      salary: 25000,
      equity: 0.1,
      companyHandle: "c1",
    });
    try {
      await Job.update(newJob.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const newJob = await Job.create({
      title: "gardener",
      salary: 25000,
      equity: 0.1,
      companyHandle: "c1",
    });
    await Job.remove(newJob.id);
    const res = await db.query(
      `SELECT id, title FROM jobs WHERE id=${newJob.id}`
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
