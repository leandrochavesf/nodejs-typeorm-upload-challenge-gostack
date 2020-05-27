import { getCustomRepository, getRepository, In } from 'typeorm';
import { Readable } from 'stream';
import csvParse from 'csv-parse';
import fs from 'fs';

import Category from '../models/Category';
import Trasaction from '../models/Transaction';

import TransactionRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: TransactionType;
  value: number;
  category: string;
}

type TransactionType = 'income' | 'outcome';

interface LoadFromCSV {
  categories: string[];
  transactions: CSVTransaction[];
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Trasaction[]> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const { transactions, categories } = await this.loadFromCSV(filePath);

    await fs.promises.unlink(filePath);

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }

  /**
   * Load From CSV
   */
  private async loadFromCSV(filePath: string): Promise<LoadFromCSV> {
    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    const readCSVStream = fs.createReadStream(filePath);

    await this.parseCSV(readCSVStream, ([title, type, value, category]) => {
      if (type !== 'outcome' && type !== 'income') return;

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value: parseInt(value, 10), category });
    });

    return { categories, transactions };
  }

  /**
   * Generic parse from CSV
   */
  private parseCSV(
    readable: Readable,
    callback: (columns: string[]) => void,
  ): Promise<void> {
    const parseStream = csvParse({
      from_line: 2,
      trim: true,
    });

    const parseCSV = readable.pipe(parseStream);

    return new Promise((resolve, reject) => {
      parseCSV.on('data', callback);
      parseCSV.on('error', reject);
      parseCSV.on('end', resolve);
    });
  }
}

export default ImportTransactionsService;
