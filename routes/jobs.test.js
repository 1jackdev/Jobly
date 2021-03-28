"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "gardener",
    salary: 65000,
    equity: 0.1,
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body.job.id).toEqual(expect.any(Number));
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 24000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("non-admins cannot create a job", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 10,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "a lot ",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "carpenter",
          salary: 30000,
          equity: "0.1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "gardener",
          salary: 25000,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "programmer",
          salary: 125000,
          equity: "0.1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const newJob = {
      title: "gardener",
      salary: 65000,
      equity: 0.1,
      companyHandle: "c1",
    };
    const newJobResp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    const resp = await request(app).get(`/jobs/${newJobResp.body.job.id}`);
    expect(resp.body).toEqual({
      job: {
        id: newJobResp.body.job.id,
        title: "gardener",
        salary: 65000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const newJob = {
      title: "gardener",
      salary: 65000,
      equity: 0.1,
      companyHandle: "c1",
    };
    const newJobResp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
      .patch(`/jobs/${newJobResp.body.job.id}`)
      .send({
        title: "Secretary",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        title: "Secretary",
        salary: 65000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("non-admins cannot update a job", async () => {
    const resp = await request(app)
      .patch(`/jobs/2`)
      .send({
        title: "not a good job",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/2`).send({
      title: "not a job at all",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new job",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/2`)
      .send({
        id: 3,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/2`)
      .send({
        salary: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const newJob = {
      title: "gardener",
      salary: 65000,
      equity: 0.1,
      companyHandle: "c1",
    };
    const newJobResp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
      .delete(`/jobs/${newJobResp.body.job.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${newJobResp.body.job.id}` });
  });

  test("non-admin cannot delete job", async function () {
    const resp = await request(app)
      .delete(`/jobs/2`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/5`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
