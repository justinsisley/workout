'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { z } from 'zod'

export interface TransactionOperation {
  id: string
  collection: string
  operation: 'create' | 'update' | 'delete'
  data: any
  originalData?: any // For rollback
}

export interface TransactionResult {
  success: boolean
  operationId: string
  result?: any
  error?: string
}

export interface ProgressTransaction {
  id: string
  userId: string
  operations: TransactionOperation[]
  results: TransactionResult[]
  status: 'pending' | 'committed' | 'rolled_back' | 'failed'
  timestamp: string
  rollbackReason?: string
}

/**
 * Comprehensive atomic transaction manager for progress updates
 * Provides rollback capability and ensures data integrity across operations
 */
export class ProgressTransactionManager {
  private payload: any
  private transaction: ProgressTransaction

  constructor(userId: string, transactionId?: string) {
    this.transaction = {
      id: transactionId || `txn_${Date.now()}_${userId}`,
      userId,
      operations: [],
      results: [],
      status: 'pending',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Initialize the transaction manager with PayloadCMS
   */
  async initialize(): Promise<void> {
    this.payload = await getPayload({ config: configPromise })
  }

  /**
   * Add a create operation to the transaction
   */
  addCreateOperation(collection: string, data: any): string {
    const operationId = `op_${Date.now()}_${this.transaction.operations.length}`
    this.transaction.operations.push({
      id: operationId,
      collection,
      operation: 'create',
      data,
    })
    return operationId
  }

  /**
   * Add an update operation to the transaction
   */
  addUpdateOperation(collection: string, id: string, data: any, originalData?: any): string {
    const operationId = `op_${Date.now()}_${this.transaction.operations.length}`
    this.transaction.operations.push({
      id: operationId,
      collection,
      operation: 'update',
      data: { id, ...data },
      originalData,
    })
    return operationId
  }

  /**
   * Add a delete operation to the transaction
   */
  addDeleteOperation(collection: string, id: string, originalData?: any): string {
    const operationId = `op_${Date.now()}_${this.transaction.operations.length}`
    this.transaction.operations.push({
      id: operationId,
      collection,
      operation: 'delete',
      data: { id },
      originalData,
    })
    return operationId
  }

  /**
   * Execute all operations atomically
   * If any operation fails, all changes are rolled back
   */
  async commit(): Promise<{
    success: boolean
    error?: string
    results?: TransactionResult[]
    transactionId: string
  }> {
    try {
      if (!this.payload) {
        await this.initialize()
      }

      // Execute all operations in sequence
      const results: TransactionResult[] = []

      for (const operation of this.transaction.operations) {
        try {
          let result: any

          switch (operation.operation) {
            case 'create':
              result = await this.payload.create({
                collection: operation.collection,
                data: operation.data,
              })
              break

            case 'update':
              // Fetch original data for rollback if not provided
              if (!operation.originalData && operation.data.id) {
                try {
                  operation.originalData = await this.payload.findByID({
                    collection: operation.collection,
                    id: operation.data.id,
                  })
                } catch (error) {
                  // Original data fetch failed, continue without rollback capability
                  console.warn('Could not fetch original data for rollback:', error)
                }
              }

              result = await this.payload.update({
                collection: operation.collection,
                id: operation.data.id,
                data: operation.data,
              })
              break

            case 'delete':
              // Fetch original data for rollback if not provided
              if (!operation.originalData) {
                try {
                  operation.originalData = await this.payload.findByID({
                    collection: operation.collection,
                    id: operation.data.id,
                  })
                } catch (error) {
                  console.warn('Could not fetch original data for rollback:', error)
                }
              }

              result = await this.payload.delete({
                collection: operation.collection,
                id: operation.data.id,
              })
              break

            default:
              throw new Error(`Unsupported operation: ${operation.operation}`)
          }

          results.push({
            success: true,
            operationId: operation.id,
            result: result || undefined,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({
            success: false,
            operationId: operation.id,
            error: errorMessage,
          })

          // Operation failed - rollback all successful operations
          await this.rollback(results)
          this.transaction.status = 'failed'

          return {
            success: false,
            error: `Transaction failed at operation ${operation.id}: ${errorMessage}`,
            results,
            transactionId: this.transaction.id,
          }
        }
      }

      // All operations successful
      this.transaction.results = results
      this.transaction.status = 'committed'

      return {
        success: true,
        results,
        transactionId: this.transaction.id,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error'
      this.transaction.status = 'failed'

      return {
        success: false,
        error: errorMessage,
        transactionId: this.transaction.id,
      }
    }
  }

  /**
   * Rollback all successful operations in reverse order
   */
  private async rollback(results: TransactionResult[]): Promise<void> {
    try {
      // Process successful results in reverse order
      const successfulResults = results.filter((r) => r.success).reverse()

      for (let i = 0; i < successfulResults.length; i++) {
        const result = successfulResults[i]
        const operation = this.transaction.operations.find((op) => op.id === result?.operationId)

        if (!operation || !result) continue

        try {
          switch (operation.operation) {
            case 'create':
              // Undo create by deleting the created record
              if (result.result && typeof result.result === 'object' && 'id' in result.result) {
                await this.payload.delete({
                  collection: operation.collection,
                  id: result.result.id,
                })
              }
              break

            case 'update':
              // Undo update by restoring original data
              if (operation.originalData && operation.data.id) {
                await this.payload.update({
                  collection: operation.collection,
                  id: operation.data.id,
                  data: operation.originalData,
                })
              }
              break

            case 'delete':
              // Undo delete by recreating the record
              if (operation.originalData) {
                await this.payload.create({
                  collection: operation.collection,
                  data: operation.originalData,
                })
              }
              break
          }
        } catch (rollbackError) {
          console.error(`Rollback failed for operation ${operation.id}:`, rollbackError)
        }
      }

      this.transaction.status = 'rolled_back'
    } catch (error) {
      console.error('Critical rollback failure:', error)
      this.transaction.status = 'failed'
    }
  }

  /**
   * Manual rollback using transaction ID
   */
  async rollbackTransaction(reason: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      if (this.transaction.status !== 'committed') {
        return {
          success: false,
          error: 'Can only rollback committed transactions',
        }
      }

      await this.rollback(this.transaction.results)
      this.transaction.rollbackReason = reason

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rollback failed'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Get transaction status and details
   */
  getTransactionInfo(): ProgressTransaction {
    return { ...this.transaction }
  }
}

/**
 * Create a new atomic progress transaction
 */
export async function createProgressTransaction(
  userId: string,
  transactionId?: string,
): Promise<ProgressTransactionManager> {
  const manager = new ProgressTransactionManager(userId, transactionId)
  await manager.initialize()
  return manager
}

// Validation schema for atomic progress updates
const AtomicProgressUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  programId: z.string().min(1, 'Program ID is required'),
  updates: z.object({
    currentMilestone: z.number().int().min(0).optional(),
    currentDay: z.number().int().min(0).optional(),
    totalWorkoutsCompleted: z.number().int().min(0).optional(),
    lastWorkoutDate: z.string().datetime().optional(),
  }),
  exerciseCompletions: z
    .array(
      z.object({
        exerciseId: z.string(),
        sets: z.number().int().min(1),
        reps: z.number().int().min(1),
        weight: z.number().min(0).optional(),
        time: z.number().min(0).optional(),
        distance: z.number().min(0).optional(),
        distanceUnit: z.enum(['meters', 'miles']).optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .optional(),
  sessionMetadata: z
    .object({
      sessionId: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      duration: z.number().min(0).optional(),
    })
    .optional(),
})

export type AtomicProgressUpdateInput = z.infer<typeof AtomicProgressUpdateSchema>

export interface AtomicProgressUpdateResult {
  success: boolean
  error?: string
  transactionId: string
  rollbackAvailable: boolean
  results?: {
    userProgressUpdated: boolean
    exerciseCompletionsCreated: number
    sessionMetadataCreated: boolean
  }
}

/**
 * Perform atomic progress update with multiple related operations
 * Ensures all operations succeed or all are rolled back
 */
export async function performAtomicProgressUpdate(
  input: AtomicProgressUpdateInput,
): Promise<AtomicProgressUpdateResult> {
  try {
    // Validate input
    const validatedInput = AtomicProgressUpdateSchema.parse(input)

    // Create transaction manager
    const transaction = await createProgressTransaction(validatedInput.userId)

    // Add user progress update operation
    const userUpdateOp = transaction.addUpdateOperation(
      'productUsers',
      validatedInput.userId,
      validatedInput.updates,
    )

    // Add exercise completion operations if provided
    const exerciseCompletionOps: string[] = []
    if (validatedInput.exerciseCompletions) {
      for (const completion of validatedInput.exerciseCompletions) {
        const completionData = {
          productUser: validatedInput.userId,
          exercise: completion.exerciseId,
          program: validatedInput.programId,
          milestoneIndex: validatedInput.updates.currentMilestone || 0,
          dayIndex: validatedInput.updates.currentDay || 0,
          sets: completion.sets,
          reps: completion.reps,
          weight: completion.weight,
          time: completion.time,
          distance: completion.distance,
          distanceUnit: completion.distanceUnit,
          notes: completion.notes,
          completedAt: new Date().toISOString(),
        }

        const opId = transaction.addCreateOperation('exerciseCompletions', completionData)
        exerciseCompletionOps.push(opId)
      }
    }

    // Add session metadata operation if provided
    let sessionMetadataOp: string | null = null
    if (validatedInput.sessionMetadata) {
      const sessionData = {
        productUser: validatedInput.userId,
        program: validatedInput.programId,
        ...validatedInput.sessionMetadata,
        createdAt: new Date().toISOString(),
      }

      // Using exerciseCompletions for session metadata for now
      // TODO: Create dedicated session metadata collection
      sessionMetadataOp = transaction.addCreateOperation('exerciseCompletions', {
        ...sessionData,
        exercise: 'session-metadata',
        milestoneIndex: 0,
        dayIndex: 0,
        sets: 0,
        reps: 0,
        notes: JSON.stringify(validatedInput.sessionMetadata),
      })
    }

    // Execute transaction
    const commitResult = await transaction.commit()

    if (!commitResult.success) {
      return {
        success: false,
        error: commitResult.error || 'Transaction failed',
        transactionId: commitResult.transactionId,
        rollbackAvailable: false,
      }
    }

    return {
      success: true,
      transactionId: commitResult.transactionId,
      rollbackAvailable: true,
      results: {
        userProgressUpdated:
          commitResult.results?.some((r) => r.operationId === userUpdateOp && r.success) || false,
        exerciseCompletionsCreated: exerciseCompletionOps.filter((opId) =>
          commitResult.results?.some((r) => r.operationId === opId && r.success),
        ).length,
        sessionMetadataCreated: sessionMetadataOp
          ? commitResult.results?.some((r) => r.operationId === sessionMetadataOp && r.success) ||
            false
          : false,
      },
    }
  } catch (error) {
    console.error('Atomic progress update error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid input data: ${error.issues.map((e) => e.message).join(', ')}`,
        transactionId: `failed_${Date.now()}`,
        rollbackAvailable: false,
      }
    }

    return {
      success: false,
      error: 'Failed to perform atomic progress update',
      transactionId: `failed_${Date.now()}`,
      rollbackAvailable: false,
    }
  }
}

/**
 * Rollback a committed transaction by ID
 */
export async function rollbackProgressTransaction(
  _transactionId: string,
  _userId: string,
  _reason: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // For this implementation, we'd need to store transaction metadata
    // For now, return a placeholder response
    // TODO: Implement transaction metadata storage and retrieval

    return {
      success: false,
      error:
        'Transaction rollback not yet implemented - transactions are automatically rolled back on failure',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rollback failed',
    }
  }
}
