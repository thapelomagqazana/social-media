/**
 * @fileoverview Search Routes
 * @module routes/searchRoutes
 * @description Defines API endpoint for user and post search functionality.
 */

const express = require("express");
const { search } = require("../controllers/searchController.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search users or posts
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search users or posts
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, posts]
 *         description: Type of search (users or posts)
 *     responses:
 *       200:
 *         description: Search results returned
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Server error
 */
router.get("/", search);

module.exports = router;
