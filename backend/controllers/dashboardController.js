const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [patientCount] = await db.execute('SELECT COUNT(*) as count FROM patients');
        const [doctorCount] = await db.execute('SELECT COUNT(*) as count FROM doctors');
        const [appointmentCount] = await db.execute('SELECT COUNT(*) as count FROM appointments');
        
        // Today's appointments
        const today = new Date().toISOString().split('T')[0];
        const [todayAppointments] = await db.execute(
            'SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = ?', 
            [today]
        );

        // 7 days Appointment Trend
        const [appointmentTrend] = await db.execute(`
            SELECT DATE(appointment_date) as date, COUNT(*) as count 
            FROM appointments 
            WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(appointment_date)
            ORDER BY DATE(appointment_date) ASC
        `);

        // 7 days Revenue Trend (from invoices)
        const [revenueTrend] = await db.execute(`
            SELECT DATE(created_at) as date, SUM(total_amount) as revenue 
            FROM invoices 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = 'paid'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `);

        // Format dates
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return `${d.getDate()}/${d.getMonth()+1}`;
        };

        const chartData = {};
        
        // Ensure 7 days array
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = formatDate(d.toISOString());
            chartData[key] = { name: key, appointments: 0, revenue: 0 };
        }

        appointmentTrend.forEach(row => {
            const key = formatDate(row.date);
            if(chartData[key]) chartData[key].appointments = row.count;
        });

        revenueTrend.forEach(row => {
            const key = formatDate(row.date);
            if(chartData[key]) chartData[key].revenue = parseInt(row.revenue);
        });

        res.json({
            totalPatients: patientCount[0].count,
            totalDoctors: doctorCount[0].count,
            totalAppointments: appointmentCount[0].count,
            todayAppointments: todayAppointments[0].count,
            chartData: Object.values(chartData)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
