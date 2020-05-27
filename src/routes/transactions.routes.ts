import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

/**
 * GET method
 */
transactionsRouter.get('/', async (request, response) => {
  try {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.getTransactions();
    const balance = await transactionsRepository.getBalance();

    return response.status(200).json({ transactions, balance });
  } catch (error) {
    return response.status(500).json(error);
  }
});

/**
 * POST method
 * STRUCTURE:
 * 1. GET PARAMS
 * 2. INSTANTIATE SERVICE
 * 3. RUN SERVICE TRANSACTION WITH RECEIVED DATA
 * 4. RECEIVE TRANSACTION
 * 6. RETURN TRANSACTION TO API USING JSON
 */
transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.status(201).json(transaction);
});

/**
 * DELETE method
 */
transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.status(204).json({});
});

/**
 * POST IMPORT  method
 */
transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    /**
     * STRUCTURE
     * 1. MAKE UPLOAD FILE (AS MIDDLEWARE)
     * 2. RECEIVE DATA FROM DISKSTORAGE
     * 3. CALL TRANSACTION SERVICE
     * 4. RETURN DATA
     */

    const importTransaction = new ImportTransactionsService();

    const transactions = await importTransaction.execute(request.file.path);

    return response.status(201).json(transactions);
  },
);

export default transactionsRouter;
