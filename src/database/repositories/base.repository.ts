import { PrismaClient } from '../../../generated/prisma/client';

type ModelNames = keyof Omit<
  PrismaClient,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$use'
  | '$extends'
  | symbol
>;

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly model: ModelNames,
  ) {}

  private get delegate(): any {
    return this.prisma[this.model];
  }

  async findAll(options?: {
    where?: Partial<T>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    include?: Record<string, boolean>;
  }): Promise<T[]> {
    return this.delegate.findMany(options ?? {});
  }

  async findOne(id: number | string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findBy(
    where: Partial<T>,
    include?: Record<string, boolean>,
  ): Promise<T | null> {
    return this.delegate.findFirst({ where, include });
  }

  async findManyBy(where: Partial<T>): Promise<T[]> {
    return this.delegate.findMany({ where });
  }

  async create(data: CreateDto): Promise<T> {
    return this.delegate.create({ data });
  }

  async createMany(data: CreateDto[]): Promise<{ count: number }> {
    return this.delegate.createMany({ data });
  }

  async update(id: number | string, data: UpdateDto): Promise<T> {
    return this.delegate.update({ where: { id }, data });
  }

  async updateMany(
    where: Partial<T>,
    data: UpdateDto,
  ): Promise<{ count: number }> {
    return this.delegate.updateMany({ where, data });
  }

  async delete(id: number | string): Promise<T> {
    return this.delegate.delete({ where: { id } });
  }

  async deleteMany(where: Partial<T>): Promise<{ count: number }> {
    return this.delegate.deleteMany({ where });
  }

  async count(where?: Partial<T>): Promise<number> {
    return this.delegate.count({ where });
  }

  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.delegate.count({ where });
    return count > 0;
  }

  async paginate(
    page: number = 1,
    limit: number = 10,
    where?: Partial<T>,
    orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<{ data: T[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.delegate.findMany({ where, skip, take: limit, orderBy }),
      this.delegate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
