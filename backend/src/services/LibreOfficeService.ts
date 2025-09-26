import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}

export class LibreOfficeService {
  private logger: winston.Logger;
  private semaphore: Semaphore;
  private readonly maxRetries: number = 3;
  private readonly baseTimeout: number = 60000; // 60 seconds
  private readonly libreOfficeCommand: string;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] LibreOffice: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });

    // Limit concurrent LibreOffice processes to prevent resource exhaustion
    this.semaphore = new Semaphore(2);

    // Detect LibreOffice command
    this.libreOfficeCommand = this.detectLibreOfficeCommand();
    this.logger.info(`Using LibreOffice command: ${this.libreOfficeCommand}`);
  }

  private detectLibreOfficeCommand(): string {
    const commands = ['soffice', 'libreoffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice'];
    
    for (const cmd of commands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore', timeout: 5000 });
        return cmd;
      } catch {
        // Command not found, try next
      }
    }

    // Default to soffice
    this.logger.warn('LibreOffice command not found in PATH, defaulting to soffice');
    return 'soffice';
  }

  async convertToWordWithRetry(
    inputPath: string,
    outputDir: string,
    maxRetries: number = this.maxRetries,
    baseTimeout: number = this.baseTimeout
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    await this.semaphore.acquire();

    try {
      this.logger.info('Starting Word conversion with retry', {
        inputPath,
        outputDir,
        maxRetries,
        baseTimeout
      });

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const timeout = baseTimeout * Math.pow(1.5, attempt - 1); // Exponential backoff
          this.logger.info(`Attempt ${attempt}/${maxRetries}`, {
            timeout,
            inputPath
          });

          const result = await this.convertToWord(inputPath, outputDir, timeout);
          
          if (result.success) {
            this.logger.info('Word conversion successful', {
              attempt,
              inputPath,
              outputPath: result.outputPath
            });
            return result;
          }

          lastError = new Error(result.error || 'Unknown conversion error');
          this.logger.warn(`Word conversion attempt ${attempt} failed`, {
            error: result.error,
            inputPath
          });

          // Wait before retry (except on last attempt)
          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt; // Progressive wait
            this.logger.info(`Waiting ${waitTime}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

        } catch (error: any) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.logger.error(`Word conversion attempt ${attempt} threw error`, {
            error: lastError.message,
            inputPath
          });

          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      return {
        success: false,
        error: `Word conversion failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
      };

    } finally {
      this.semaphore.release();
    }
  }

  async convertToPdfWithRetry(
    inputPath: string,
    outputDir: string,
    maxRetries: number = this.maxRetries,
    baseTimeout: number = this.baseTimeout
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    await this.semaphore.acquire();

    try {
      this.logger.info('Starting PDF conversion with retry', {
        inputPath,
        outputDir,
        maxRetries,
        baseTimeout
      });

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const timeout = baseTimeout * Math.pow(1.5, attempt - 1);
          this.logger.info(`Attempt ${attempt}/${maxRetries}`, {
            timeout,
            inputPath
          });

          const result = await this.convertToPdf(inputPath, outputDir, timeout);
          
          if (result.success) {
            this.logger.info('PDF conversion successful', {
              attempt,
              inputPath,
              outputPath: result.outputPath
            });
            return result;
          }

          lastError = new Error(result.error || 'Unknown conversion error');
          this.logger.warn(`PDF conversion attempt ${attempt} failed`, {
            error: result.error,
            inputPath
          });

          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt;
            this.logger.info(`Waiting ${waitTime}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

        } catch (error: any) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.logger.error(`PDF conversion attempt ${attempt} threw error`, {
            error: lastError.message,
            inputPath
          });

          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      return {
        success: false,
        error: `PDF conversion failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
      };

    } finally {
      this.semaphore.release();
    }
  }

  private async convertToWord(
    inputPath: string,
    outputDir: string,
    timeout: number
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return this.convertDocument(inputPath, outputDir, 'docx', timeout);
  }

  private async convertToPdf(
    inputPath: string,
    outputDir: string,
    timeout: number
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    return this.convertDocument(inputPath, outputDir, 'pdf', timeout);
  }

  private async convertDocument(
    inputPath: string,
    outputDir: string,
    format: string,
    timeout: number
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> {
    try {
      // Validate input file exists
      if (!fs.existsSync(inputPath)) {
        return { success: false, error: `Input file does not exist: ${inputPath}` };
      }

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error: any) {
          return { 
            success: false, 
            error: `Failed to create output directory: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }

      // Clean up any existing LibreOffice processes that might be hanging
      await this.cleanupLibreOfficeProcesses();

      const fileName = path.basename(inputPath, path.extname(inputPath));
      const expectedOutputPath = path.join(outputDir, `${fileName}.${format}`);

      // Remove existing output file if it exists
      if (fs.existsSync(expectedOutputPath)) {
        try {
          fs.unlinkSync(expectedOutputPath);
        } catch (error: any) {
          this.logger.warn('Failed to remove existing output file', {
            outputPath: expectedOutputPath,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      this.logger.info('Starting LibreOffice conversion', {
        inputPath,
        outputDir,
        format,
        timeout,
        expectedOutputPath
      });

      // Build command
      const command = this.libreOfficeCommand;
      const args = [
        '--headless',
        '--convert-to',
        format,
        '--outdir',
        outputDir,
        inputPath
      ];

      this.logger.info('Executing LibreOffice command', {
        command,
        args: args.join(' ')
      });

      // Execute conversion with proper timeout and error handling
      const result = await this.executeCommandWithTimeout(command, args, timeout);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Check if output file was created
      const maxWaitTime = 10000; // 10 seconds max wait for file to appear
      const startTime = Date.now();
      
      while (!fs.existsSync(expectedOutputPath) && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!fs.existsSync(expectedOutputPath)) {
        // List files in output directory for debugging
        try {
          const files = fs.readdirSync(outputDir);
          this.logger.error('Output file not found after conversion', {
            expectedOutputPath,
            filesInOutputDir: files,
            inputPath,
            format
          });
        } catch (listError) {
          this.logger.error('Failed to list output directory contents', {
            outputDir,
            error: listError instanceof Error ? listError.message : 'Unknown error'
          });
        }

        return {
          success: false,
          error: `Conversion completed but output file not found: ${expectedOutputPath}`
        };
      }

      // Validate output file
      const stats = fs.statSync(expectedOutputPath);
      if (stats.size === 0) {
        return {
          success: false,
          error: `Conversion produced empty file: ${expectedOutputPath}`
        };
      }

      this.logger.info('LibreOffice conversion completed successfully', {
        inputPath,
        outputPath: expectedOutputPath,
        fileSize: stats.size
      });

      return {
        success: true,
        outputPath: expectedOutputPath
      };

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('LibreOffice conversion error', {
        inputPath,
        outputDir,
        format,
        error: errorMessage
      });

      return {
        success: false,
        error: `Conversion failed: ${errorMessage}`
      };
    }
  }

  private async executeCommandWithTimeout(
    command: string,
    args: string[],
    timeout: number
  ): Promise<{ success: boolean; error?: string; output?: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      let stdout = '';
      let stderr = '';
      let finished = false;

      const timeoutId = setTimeout(() => {
        if (!finished) {
          finished = true;
          this.logger.warn('LibreOffice process timeout, killing process', {
            command,
            args: args.join(' '),
            timeout,
            pid: child.pid
          });

          // Kill the process and its children
          try {
            if (child.pid) {
              process.kill(-child.pid, 'SIGKILL');
            }
          } catch (error: any) {
            this.logger.error('Failed to kill timed out process', {
              pid: child.pid,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }

          resolve({
            success: false,
            error: `LibreOffice process timed out after ${timeout}ms`
          });
        }
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeoutId);

          if (code === 0) {
            resolve({
              success: true,
              output: stdout
            });
          } else {
            this.logger.error('LibreOffice process exited with error', {
              code,
              stdout,
              stderr,
              command,
              args: args.join(' ')
            });

            resolve({
              success: false,
              error: `LibreOffice exited with code ${code}: ${stderr || stdout}`
            });
          }
        }
      });

      child.on('error', (error: any) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeoutId);

          this.logger.error('LibreOffice process error', {
            error: error.message,
            command,
            args: args.join(' ')
          });

          resolve({
            success: false,
            error: `Failed to start LibreOffice process: ${error.message}`
          });
        }
      });
    });
  }

  private async cleanupLibreOfficeProcesses(): Promise<void> {
    try {
      // Kill any hanging LibreOffice processes
      const { execSync } = require('child_process');
      
      // Check for LibreOffice processes
      try {
        const processes = execSync('pgrep -f soffice', { encoding: 'utf8', timeout: 5000 }).trim();
        if (processes) {
          this.logger.info('Found existing LibreOffice processes, cleaning up', {
            processes: processes.split('\n')
          });
          
          execSync('pkill -f soffice', { timeout: 5000 });
          
          // Wait a moment for processes to die
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        // No processes found or error checking - this is fine
      }
    } catch (error: any) {
      this.logger.warn('Failed to cleanup LibreOffice processes', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async extractTextFromDocument(
    inputPath: string,
    outputDir: string
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const extension = path.extname(inputPath).toLowerCase();
      
      // For PDFs, use pdftotext directly since LibreOffice doesn't handle PDF-to-text well
      if (extension === '.pdf') {
        return await this.extractTextFromPDF(inputPath);
      }
      
      // For other documents, use LibreOffice conversion to text format
      const result = await this.convertDocument(inputPath, outputDir, 'txt', this.baseTimeout);
      
      if (!result.success || !result.outputPath) {
        return { success: false, error: result.error };
      }

      // Read the text file
      const text = fs.readFileSync(result.outputPath, 'utf8');
      
      // Clean up the temporary text file
      try {
        fs.unlinkSync(result.outputPath);
      } catch (cleanupError) {
        this.logger.warn('Failed to cleanup temporary text file', {
          filePath: result.outputPath,
          error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
        });
      }

      return { success: true, text };

    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async extractTextFromPDF(pdfPath: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      this.logger.info('Extracting text from PDF using pdftotext', { pdfPath });
      
      const { execSync } = require('child_process');
      
      // Use pdftotext to extract text from PDF
      const command = `pdftotext "${pdfPath}" -`;
      
      this.logger.info('Executing pdftotext command', { command });
      
      const text = execSync(command, {
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'PDF text extraction returned empty content'
        };
      }

      this.logger.info('PDF text extraction successful', {
        pdfPath,
        textLength: text.length,
        preview: text.substring(0, 200) + '...'
      });

      return {
        success: true,
        text: text
      };

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PDF text extraction failed', {
        pdfPath,
        error: errorMessage
      });

      return {
        success: false,
        error: `PDF text extraction failed: ${errorMessage}`
      };
    }
  }
}