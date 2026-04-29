import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface defining the document properties based on example.txt
export interface IPackage extends Document {
  id: number;
  packageCategoryId: string;
  packageCategoryType: number;
  stauts: number;
  packageType: number;
  availabilityStatus: number;
  serviceProviderId: number;
  startDate: Date;
  endDate: Date;
  capacity: number;
  capacityUsed: number;
  tourGuideCapacity: number;
  applicantsPerTourGuide: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  campId: string;
  campIds: string[];
  price: number;
  vat: number;
  totalPrice: number;
  uuid: string;
  madinahGroundCenterId: number | null;
  makkahGroundCenterId: number | null;
  imageUrl: string;
  created: Date;
  packageDurationDays: number;
  availableSeats: number;
  packageCategoryName: string;
  makkahRating: number;
  ratingFrom: number;
  ratingTo: number;
  housingZoneId: number;
  housingZoneNameEn: string;
  housingZoneNameAr: string;
  serviceProviderNameEn: string;
  serviceProviderNameAr: string;
  serviceProviderImageUrl: string;
  serviceProviderWebsite: string;
  isPreferred: boolean;
  isCountryCapacityFull: boolean;
  isResidentCapacityFull: boolean;
  isCampCapacityFull: boolean;
  numberOfNights: number | null;
  packageValidityDates: string | null;
  packageNights: number | null;
  firstCityNumberOfNights: number | null;
  lastCityNumberOfNights: number | null;
  firstNumberOfNights: number | null;
  lastNumberOfNights: number | null;
  totallNumberOfNights: number | null;
  roomAvailability: number;
  isSpCampQuotaFull: boolean | null;
  zoneNameEn: string;
  zoneNameAr: string;
  isQuotaMerged: boolean;
  isAllCampCapacityFull: boolean;
  rowNum: number;
  numberOfQuotaTypes: number;
  isGlobalMergedToB2C: boolean;
  isGlobalMergedToCourtesy: boolean;
  detailed_html: string;
  isSoldOut: boolean;
}

const PackageSchema: Schema = new mongoose.Schema(
  {
    id: { type: Number },
    packageCategoryId: { type: String },
    packageCategoryType: { type: Number },
    stauts: { type: Number }, // typo in original data
    packageType: { type: Number },
    availabilityStatus: { type: Number },
    serviceProviderId: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    capacity: { type: Number },
    capacityUsed: { type: Number },
    tourGuideCapacity: { type: Number },
    applicantsPerTourGuide: { type: Number },
    nameAr: { type: String },
    nameEn: { type: String },
    descriptionAr: { type: String },
    descriptionEn: { type: String },
    campId: { type: String },
    campIds: { type: [String] },
    price: { type: Number },
    vat: { type: Number },
    totalPrice: { type: Number },
    uuid: { type: String, required: true, unique: true, index: true },
    madinahGroundCenterId: { type: Number, default: null },
    makkahGroundCenterId: { type: Number, default: null },
    imageUrl: { type: String },
    created: { type: Date },
    packageDurationDays: { type: Number },
    availableSeats: { type: Number },
    packageCategoryName: { type: String },
    makkahRating: { type: Number },
    ratingFrom: { type: Number },
    ratingTo: { type: Number },
    housingZoneId: { type: Number },
    housingZoneNameEn: { type: String },
    housingZoneNameAr: { type: String },
    serviceProviderNameEn: { type: String },
    serviceProviderNameAr: { type: String },
    serviceProviderImageUrl: { type: String },
    serviceProviderWebsite: { type: String },
    isPreferred: { type: Boolean },
    isCountryCapacityFull: { type: Boolean },
    isResidentCapacityFull: { type: Boolean },
    isCampCapacityFull: { type: Boolean },
    numberOfNights: { type: Number, default: null },
    packageValidityDates: { type: String, default: null },
    packageNights: { type: Number, default: null },
    firstCityNumberOfNights: { type: Number, default: null },
    lastCityNumberOfNights: { type: Number, default: null },
    firstNumberOfNights: { type: Number, default: null },
    lastNumberOfNights: { type: Number, default: null },
    totallNumberOfNights: { type: Number, default: null },
    roomAvailability: { type: Number },
    isSpCampQuotaFull: { type: Boolean, default: null },
    zoneNameEn: { type: String },
    zoneNameAr: { type: String },
    isQuotaMerged: { type: Boolean },
    isAllCampCapacityFull: { type: Boolean },
    rowNum: { type: Number },
    numberOfQuotaTypes: { type: Number },
    isGlobalMergedToB2C: { type: Boolean },
    isGlobalMergedToCourtesy: { type: Boolean },
    detailed_html: { type: String },
    isSoldOut: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Prevent mongoose from recreating the model if it already exists
const Package: Model<IPackage> = mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
