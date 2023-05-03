\c biztime

DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS comp_indus CASCADE;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  code text PRIMARY KEY,
  industry text NOT NULL UNIQUE
);

CREATE TABLE comp_indus (
  comp_code text NOT NULL REFERENCES companies (code) ON DELETE CASCADE,
  indus_code text NOT NULL REFERENCES industries (code) ON DELETE CASCADE,
  PRIMARY KEY(comp_code, indus_code)
);

INSERT INTO industries
  VALUES ('tech', 'technology'), ('acct', 'accounting'), ('env', 'environmental'), ('ftns', 'fitness');

INSERT INTO companies (code, name, description)
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.'), ('adidas', 'Adidas', 'Maker of athletic sportswear'), ('deloitte', 'Deloitte Consulting', 'Business and accounting consultancy'), ('patagonia', 'Patagonia Apparel', 'Environmentally conscious clothing and sportswear company');

INSERT INTO comp_indus
  VALUES ('apple', 'tech'),('ibm', 'tech'), ('adidas', 'ftns'), ('deloitte', 'acct'), ('patagonia', 'ftns'), ('patagonia', 'env');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);
