import { User } from '@asistente/auth-model';
import { UserDocument } from '@asistente/auth-data-access';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(doc: UserDocument): SafeUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    displayName: doc.displayName,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}
