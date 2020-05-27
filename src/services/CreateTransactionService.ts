/**
 * STRUCTURE:
 * 1 - IMPORTS
 * 2 - TYPING (INTEFACE)
 * 3 - CLASS
 * 3.1 - FUNCIONALITIES
 * 4 - EXPORT CLASS
 */

import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

/**
 * STRUCTURE (EXECUTE FUNCTION):
 * 1. EXECUTE FUNCTION
 */
class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (typeof value !== 'number') throw Error('Value must be a number.');

    if (typeof title !== 'string') throw Error('Title must be a string.');

    if (type !== 'income' && type !== 'outcome')
      throw Error('Type must be income or outcome.');

    /**
     * VERIFY IF CATEGORY ALREADY EXISTS
     */
    let category_id = '';

    let transactionCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({
        title: category,
      });

      const { id } = await categoriesRepository.save(transactionCategory);
      category_id = id;
    } else {
      category_id = transactionCategory.id;
    }

    /**
     * GET BALANCE E VERIFY IF IS NEGATIVE
     */
    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && value > total) {
      throw new AppError("You don't have enought balance.");
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
