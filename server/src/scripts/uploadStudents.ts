import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Student, { IStudent } from '../models/Student';
import connectDB from '../db';

const UPLOAD_FILE_NAME = 'students.csv';
const PASSWORD = 'password123';
const BATCH_SIZE = 100;

const uploadStudents = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  const csvPath = path.join(__dirname, '..', '..', UPLOAD_FILE_NAME);
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: The file "${UPLOAD_FILE_NAME}" was not found in the "server" directory.`);
    console.error('Please make sure your CSV file is in the correct location and named correctly.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const results: any[] = [];
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  console.log(`Starting to process ${UPLOAD_FILE_NAME}...`);

  const processBatch = async (batch: any[]) => {
    const operations = batch.map(async (data) => {
      try {
        const { usn, name, email, admissionYear, branch, section, gender } = data;

        // Basic validation
        if (!usn || !name || !email || !admissionYear || !branch || !section) {
          console.warn(`Skipping row: missing required data. USN: ${usn || 'N/A'}, Email: ${email || 'N/A'}`);
          skippedCount++;
          return;
        }
        
        const sanitizedUSN = usn.toUpperCase().trim();
        const sanitizedEmail = email.toLowerCase().trim();

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(PASSWORD, salt);

        await Student.findOneAndUpdate(
          { usn: sanitizedUSN },
          {
            $set: {
              name: name.trim(),
              email: sanitizedEmail,
              password: hashedPassword,
              admissionYear: parseInt(admissionYear, 10),
              branch: branch.toLowerCase().trim(),
              section: section.toLowerCase().trim(),
              ...(gender && { gender: gender.toLowerCase().trim() }),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        successCount++;
      } catch (error: any) {
        errorCount++;
        console.error(`Error processing row with USN ${data.usn}:`, error.message);
      }
    });

    await Promise.all(operations);
    processedCount += batch.length;
    console.log(`Processed ${processedCount} rows... Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);
  };

  const stream = fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data: any) => {
      results.push(data);
      if (results.length === BATCH_SIZE) {
        stream.pause();
        processBatch([...results]).then(() => {
          results.length = 0;
          stream.resume();
        });
      }
    })
    .on('end', async () => {
      if (results.length > 0) {
        await processBatch(results);
      }
      console.log('--------------------');
      console.log('CSV file processing finished.');
      console.log(`Total rows processed: ${processedCount}`);
      console.log(`Successfully added/updated: ${successCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log(`Skipped (missing data): ${skippedCount}`);
      console.log('--------------------');
      await mongoose.disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    })
    .on('error', async (error: any) => {
      console.error('An error occurred while reading the CSV file:', error);
      await mongoose.disconnect();
      process.exit(1);
    });
};

uploadStudents().catch(async (error) => {
  console.error('An unexpected error occurred:', error);
  await mongoose.disconnect();
  process.exit(1);
});
