import mongoose, { Schema, Document } from 'mongoose';

export interface IHadith extends Document {
  text: string;
  book: string;
  narrator: string;
}

const hadithSchema = new Schema<IHadith>({
  text: { type: String, required: true },
  book: { type: String, required: true },
  narrator: { type: String, required: true },
});

const Hadith = mongoose.model<IHadith>('Hadith', hadithSchema);

export default Hadith;
