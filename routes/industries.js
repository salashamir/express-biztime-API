const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// GET /industries
// Return info on industries and associated companies: like {industries: [{code, indstry, companies:[...]}, ...]}
router.get("/", async (req, res, next) => {
  try {
    const industriesRes = await db.query("SELECT * FROM industries");
    const industries = industriesRes.rows;

    for await (industry of industries) {
      const industryCompanies = await db.query(
        "SELECT c.code AS company_code FROM companies c JOIN comp_indus ci ON c.code = ci.comp_code JOIN industries i ON ci.indus_code = i.code WHERE i.code = $1",
        [industry.code]
      );
      industry.companies = industryCompanies.rows.map(
        (company) => company.company_code
      );
    }

    return res.status(200).json({ industries });
  } catch (e) {
    return next(e);
  }
});

// POST /industries
// Needs to be given JSON like: {code, industry}
// Returns obj of new industry: {industry: {code, industry}}
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    if (code === undefined || industry === undefined) {
      throw new ExpressError(
        "Post request must contain industry code and industry name",
        400
      );
    }
    const results = await db.query(
      "INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, name, description",
      [code, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// POST - associate industry to company
// send body with company code for company to be associated with indstry in params
router.post("/:ind_code", async (req, res, next) => {
  try {
    const indCode = req.params.ind_code;
    const comCode = req.body.company_code;

    if (comCode === undefined) {
      throw new ExpressError(
        "Post request must contain company code in body",
        400
      );
    }

    const industryRes = await db.query(
      "SELECT * FROM industries WHERE code = $1",
      [indCode]
    );

    if (industryRes.rows.length === 0) {
      throw new ExpressError(
        `Coudn't find industry with provided code: ${indCode}`,
        404
      );
    }

    const companyRes = await db.query(
      "SELECT * FROM companies WHERE code = $1",
      [comCode]
    );

    if (companyRes.rows.length === 0) {
      throw new ExpressError(
        `Coudn't find company with provided code: ${comCode}`,
        404
      );
    }

    const result = await db.query(
      `INSERT INTO comp_indus (comp_code, indus_code) VALUES ($1,$2) RETURNING comp_code, indus_code`,
      [comCode, indCode]
    );

    return res.json({
      msg: "Association created.",
      association: result.rows[0],
    });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
