import { useParams } from 'react-router-dom';
import FundForm from '@/components/FundForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
export default function EditFund(){const {id}=useParams();useDocumentTitle('编辑基金 · Compound Fund');return <FundForm id={Number(id)}/>;}
