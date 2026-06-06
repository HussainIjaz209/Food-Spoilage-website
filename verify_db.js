const db = require('./config/db');

async function verify() {
  console.log('Starting Car Showroom database verification...');
  try {
    // 1. Verify connected database name
    const [dbNameRow] = await db.query('SELECT DATABASE() as db;');
    console.log('Active Database:', dbNameRow[0].db);
    if (dbNameRow[0].db !== 'car_showroom') {
      throw new Error(`Expected database 'car_showroom' but connected to '${dbNameRow[0].db}'`);
    }

    // 2. Check each table row count
    const tables = [
      'users',
      'customer_profiles',
      'car_categories',
      'cars',
      'bookings',
      'installment_plans',
      'payments'
    ];

    for (const table of tables) {
      const [countRow] = await db.query(`SELECT COUNT(*) as cnt FROM ${table};`);
      console.log(`- Table '${table}' count: ${countRow[0].cnt} records.`);
    }

    // 3. Verify specific content and business logic (e.g., cancellation deadline)
    console.log('\nVerifying business constraints...');
    const [bookings] = await db.query('SELECT id, payment_method, delivery_type, total_price, booking_date, cancellation_deadline FROM bookings;');
    
    for (const booking of bookings) {
      const bookingDate = new Date(booking.booking_date);
      const cancellationDeadline = new Date(booking.cancellation_deadline);
      const diffHrs = (cancellationDeadline - bookingDate) / (1000 * 60 * 60);
      console.log(`- Booking ID ${booking.id}: method=${booking.payment_method}, delivery=${booking.delivery_type}, total=${booking.total_price}, cancellation_deadline_diff=${diffHrs} hrs`);
    }

    // 4. Verify installment relationships
    const [installments] = await db.query(`
      SELECT b.id as booking_id, i.duration_months, i.down_payment, i.monthly_installment, i.remaining_balance 
      FROM bookings b 
      JOIN installment_plans i ON b.id = i.booking_id;
    `);
    console.log('\nVerifying installments plans relations...');
    for (const inst of installments) {
      console.log(`- Installment Plan for Booking ID ${inst.booking_id}: duration=${inst.duration_months} months, down_payment=${inst.down_payment}, monthly=${inst.monthly_installment}, remaining=${inst.remaining_balance}`);
    }

    console.log('\nDatabase verification completed successfully!');
  } catch (error) {
    console.error('Database verification failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

verify();
