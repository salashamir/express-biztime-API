const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// GET /invoices
// Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM invoices");
    return res.status(200).json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

// GET /invoices/[id]
// If invoice cannot be found, returns 404.
// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoiceRes = await db.query(
      "SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description FROM invoices AS i JOIN companies AS c ON i.comp_code = c.code WHERE id = $1",
      [id]
    );

    if (invoiceRes.rows.length === 0) {
      throw new ExpressError(
        `Couldn't find and invoice with the provided id: ${id}`,
        404
      );
    }

    const data = invoiceRes.rows[0];
    const invoice = {
      ...data,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };
    return res.status(200).json({ invoice: invoice });
  } catch (e) {
    return next(e);
  }
});

// POST /invoices
// passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    if (comp_code === undefined || amt === undefined) {
      throw new ExpressError(
        "Post request must contain comp_code and amt",
        400
      );
    }
    const invoicePostRes = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: invoicePostRes.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// PUT /invoices/[id]
// If invoice cannot be found, returns a 404.
// passed in a JSON body of {amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const searchRes = await db.query("SELECT * FROM invoices WHERE id = $1", [
      id,
    ]);

    if (searchRes.rows.length === 0) {
      throw new ExpressError(`Invoice with id of: ${id} was not found.`, 404);
    }

    if (amt === undefined) {
      throw new ExpressError("Put request must contain amt", 400);
    }

    const updateRes = await db.query(
      "UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date",
      [amt, id]
    );

    return res.status(200).json({ invoice: updateRes.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// DELETE /invoices/[id]
// If invoice cannot be found, returns a 404.
// Returns: {status: "deleted"}
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `Invoice with id of: ${req.params.id} not found.`,
        404
      );
    }

    return res.status(204).json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
