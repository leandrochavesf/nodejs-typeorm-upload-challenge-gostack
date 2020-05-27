import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface CategoryDTO {
  id: string;
  title: string;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  /**
   * STRUCTURE:
   * 1. FIND IN DB FOR INCOME TYPE
   * 2. FIND IN DB FOR OUTCOME TYPE
   * 3. SUM VALUES OF INCOMES
   * 4. SOME VALUES OF OUTCOMES
   * 5. MAKE OBJECT BALANCE
   * 6. RETURN BALANCE
   */
  public async getBalance(): Promise<Balance> {
    /* ANTIQUE METHOD
    const incomes = await this.find({
      where: { type: 'income' },
    });

    const income = incomes.reduce((total, transaction) => {
      return total + transaction.value;
    }, 0);

    const outcomes = await this.find({
      where: { type: 'outcome' },
    });
    const outcome = outcomes.reduce((total, transaction) => {
      return total + transaction.value;
    }, 0);
    */

    const transactions = await this.find();

    const { income, outcome } = transactions.reduce(
      (accumulator, transaction) => {
        switch (transaction.type) {
          case 'income':
            accumulator.income += Number(transaction.value);
            break;

          case 'outcome':
            accumulator.outcome += Number(transaction.value);
            break;

          default:
            break;
        }
        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    const total = income - outcome;

    return { income, outcome, total };
  }

  public async getTransactions(): Promise<Transaction[]> {
    const transactions = this.find({
      select: ['id', 'title', 'value', 'type', 'created_at', 'updated_at'],
      relations: ['category'],
    });
    return transactions;
  }
}

export default TransactionsRepository;
