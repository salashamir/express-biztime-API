const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// GET /companies
// return: {companies:[{},{},...]}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM companies");
    return res.status(200).json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

// GET /companies/[code]
// Return obj of company: {company: {code, name, description}}
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const companyRes = await db.query(
      "SELECT * FROM companies WHERE code = $1",
      [code]
    );

    const companyInvoices = await db.query(
      "SELECT * FROM invoices WHERE comp_code = $1",
      [code]
    );

    if (companyRes.rows.length === 0) {
      throw new ExpressError(
        `Coudn't find company with provided code: ${code}`,
        404
      );
    }

    const company = companyRes.rows[0];
    company.invoices = companyInvoices.rows;

    return res.status(200).json({ company });
  } catch (e) {
    return next(e);
  }
});

// POST /companies
// Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows });
  } catch (e) {
    return next(e);
  }
});

// PUT /companies/[code]
// Should return 404 if company cannot be found.
// Needs to be given JSON like: {name, description}
// Returns update company object: {company: {code, name, description}}
router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;

    const companyRes = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
      [name, description, code]
    );

    if (companyRes.rows.length === 0) {
      throw new ExpressError(
        `Can't update company with the code provided: ${code}`
      );
    }

    return res.json({ company: companyRes.rows });
  } catch (e) {}
});

// DELETE /companies/[code]
// Should return 404 if company cannot be found.
// Returns {status: "deleted"}
router.delete("/:code", async (req, res, next) => {
  try {
    const companyRes = await db.query("DELETE FROM companies WHERE code = $1", [
      req.params.code,
    ]);

    if (companyRes.rows.length === 0) {
      throw new ExpressError(
        `Coudn't find company with provided code: ${req.params.code}`,
        404
      );
    }

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
