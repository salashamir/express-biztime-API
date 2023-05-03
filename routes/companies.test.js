process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let invoices;

beforeEach(async () => {
  const res = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('orange', 'Orange', 'creates modern upholstery') RETURNING code, name, description`
  );

  testCompany = res.rows[0];

  const invoiceRes = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('orange', 450, false, null) RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );

  invoices = invoiceRes.rows;
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async () => {
  await db.end();
});

// GET /companies list of company objects
// {companies:[{id..}...]}
describe("GET /companies", () => {
  test("Gets a list of all companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

// GET /companies/:code
// returns a specific company, 404 if company code not found
// {company:{code..., invoices:[...]}}
describe("GET /companies/:code", () => {
  test("Gets a specific company by its code", async () => {
    const res = await request(app).get("/companies/orange");
    expect(res.statusCode).toBe(200);
    expect(res.body.company.code).toEqual(testCompany.code);
    expect(res.body.company.name).toEqual(testCompany.name);
    expect(res.body.company.description).toEqual(testCompany.description);
    expect(res.body.company.invoices[0].comp_code).toEqual("orange");
  });

  test("Receives a 404 status response for an invalid code", async () => {
    const res = await request(app).get(`/companies/amazon`);
    expect(res.statusCode).toEqual(404);
  });
});

// POST /companies
// Must be given: {code, name, description}
// Returns new company object: {company: {code,..}}
describe("POST /companies", () => {
  test("Adds a new company", async () => {
    const res = await request(app).post("/companies").send({
      name: "Dasani",
      description: "Maker of fresh bottled water",
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({
      company: {
        code: "dasani",
        name: "Dasani",
        description: "Maker of fresh bottled water",
      },
    });
  });
});

// PUT /companies/:code
// Returns 404 if code not found
// Must be given JSON: {name, description}
// returns updated company obj: {company:{code,..}}
describe("PUT /companies/:code", () => {
  test("Updates company with provided code", async () => {
    const newCompanyData = {
      name: "Mandarin",
      description: "Sells loads of mandarins.",
    };
    const res = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send(newCompanyData);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        ...newCompanyData,
        code: `${testCompany.code}`,
      },
    });
  });

  test("Receives a 404 status response for an invalid code", async () => {
    const res = await request(app).put(`/companies/amazon`).send({
      name: "Facebook",
      description: "Social network.",
    });
    expect(res.statusCode).toEqual(404);
  });
});

// DELETE /companies/:code
// Should return 404 if copany not found
// returns json: {status:"deleted"}
describe("DELETE /companies/:code", () => {
  test("Deletes company with provided code", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });
});
