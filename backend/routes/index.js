const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const dashboardRoutes = require('./dashboard');
const prescriptionRoutes = require('./prescriptions');
const roomRoutes = require('./rooms');
const inventoryRoutes = require('./inventory');
const emrRoutes = require('./emr');
const labRoutes = require('./labs');
const patientPortalRoutes = require('./patientPortal');
const shiftRoutes = require('./shifts');
const visitRoutes = require('./visits');

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/clinical', prescriptionRoutes);
router.use('/rooms', roomRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/emr', emrRoutes);
router.use('/labs', labRoutes);
router.use('/patient-portal', patientPortalRoutes);
router.use('/shifts', shiftRoutes);
router.use('/visits', visitRoutes);

module.exports = router;
