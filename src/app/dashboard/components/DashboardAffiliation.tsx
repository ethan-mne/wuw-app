'use client';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
import styles from '@/styles/Dashboard.module.css';
import 'react-datetime/css/react-datetime.css';
import { api } from '@/trpc/react';
import { useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { PlusOutlined } from '@ant-design/icons';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { Formik } from 'formik';
import { Loader } from './Loader';

import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
} from '@mui/material';
import DashboardCard from './DashboardCard';

interface Affiliation {
  id: string;
  competition: {
    id: string;
    name: string;
  };
  discountCode: string;
  discountRate: number;
  ownerEmail: string;
  createdAt: Date;
  competitionId: string;
  uses: number;
  updatedAt: Date;
  compToWin: string | null;
  discountAmount: number;
}

interface AffiliationsResponse {
  data: Affiliation[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

const DashboardAffiliation = () => {
  const rows_per_page = [50, 100, 200];
  // removing the nullish "?? 50" below makes an error down there in Table
  const [currentPage, setCurrentPage] = useState(rows_per_page[0] ?? 50);
  const [pageSize, setPageSize] = useState(50);
  const [paginationInfo, setPaginationInfo] = useState({});

  const [show, setShow] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [affilationToEdit, setAffilationToEdit] = useState<{
    id: string;
    competitionId: string;
    discountRate: number;
    discountAmount: number;
    ownerEmail: string;
  }>({
    id: '',
    competitionId: '',
    discountRate: 0,
    discountAmount: 0,
    ownerEmail: '',
  });

  const { data: compDatsa } = api.Competition.getAll.useQuery();
  const {
    data: affiliationsData,
    isLoading: affiliationLoading,
    refetch: refetchAffiliations,
  } = api.Affiliation.getAll.useQuery<AffiliationsResponse>({
    page: currentPage,
    pageSize,
  });
  const {
    isSuccess: addAffiliationSuccess,
    isError: addAffiliationError,
    error: addAffiliationErrorData,
    mutateAsync: addAffiliationAsync,
  } = api.Affiliation.add.useMutation();

  const { mutateAsync: deleteAffiliationAsync } =
    api.Affiliation.delete.useMutation();

  const {
    isSuccess: editAffiliationSuccess,
    isError: editAffiliationError,
    error: editAffiliationErrorData,
    mutateAsync: editAffiliationAsync,
  } = api.Affiliation.update.useMutation();

  // Handlers for TablePagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPageSize(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleCloseEdit = () => {
    setShowEdit(false);
  };

  const handleAddAffilation = async (values: {
    competitionId: string;
    discountRate: number;
    ownerEmail: string;
  }) => {
    console.log(values);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await addAffiliationAsync(values).then(async () => {
      await refetchAffiliations();
      handleClose();
    });
    if (addAffiliationError) {
      console.log(addAffiliationErrorData);
    }
  };

  const handleEditditAffiliation = async (values: {
    id: string;
    competitionId: string;
    discountRate: number;
    ownerEmail: string;
  }) => {
    console.log(values);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await editAffiliationAsync(values).then(async () => {
      await refetchAffiliations();
      handleCloseEdit();
    });
    if (editAffiliationError) {
      console.log(editAffiliationErrorData);
    }
  };

  return (
    <div className={styles.DashCompsMain}>
      <div className={styles.dashCompsTopHeader}>
        <h1>Your Affiliations</h1>
        <Button variant='primary' onClick={() => setShow(true)}>
          <PlusOutlined /> Add
        </Button>
      </div>
      <DashboardCard title='Affiliation List'>
        {affiliationLoading ? (
          <Loader />
        ) : (
          <Box sx={{ overflow: 'auto', width: { xs: '280px', sm: 'auto' } }}>
            <Table
              aria-label='simple table'
              sx={{
                whiteSpace: 'nowrap',
                mt: 2,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      #
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Competition
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      User
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Discount Rate
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Discount Amount
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Discout Code
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Used
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Action
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {affiliationsData?.data?.map((affiliation, index) => (
                  <TableRow key={index + 1}>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: '15px',
                          fontWeight: '500',
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant='subtitle2' fontWeight={600}>
                            {affiliation?.competition?.name.length > 20
                              ? affiliation?.competition?.name.substring(
                                  0,
                                  20,
                                ) + '...'
                              : affiliation?.competition?.name}
                          </Typography>
                          <Typography
                            color='textSecondary'
                            sx={{
                              fontSize: '13px',
                            }}
                          >
                            {affiliation?.competition?.id ?? ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color='textSecondary'
                        variant='subtitle2'
                        fontWeight={400}
                      >
                        {affiliation?.ownerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        sx={{
                          px: '4px',
                          margin: '0 4px',
                          backgroundColor: '#1d305f',
                          color: '#fff',
                        }}
                        size='small'
                        label={
                          (affiliation?.discountRate * 100).toString() + '%'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='h6'>
                        {affiliation?.discountAmount.toLocaleString('en-GB', {
                          style: 'currency',
                          currency: 'GBP',
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        // discount code hide and show
                        sx={{
                          px: '4px',
                          backgroundColor: '#12Vc7a',
                          color: '#000',
                        }}
                        size='small'
                        label={affiliation?.discountCode}
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            affiliation?.discountCode,
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='h6'>{affiliation?.uses}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='h6'>
                        <Dropdown>
                          <Dropdown.Toggle variant='gray' id='dropdown-basic' />
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() => {
                                setAffilationToEdit({
                                  id: affiliation?.id ?? '',
                                  competitionId: affiliation?.competitionId,
                                  discountRate: affiliation?.discountRate ?? 0,
                                  discountAmount: affiliation?.discountAmount,
                                  ownerEmail: affiliation?.ownerEmail ?? '',
                                });
                                setShowEdit(true);
                              }}
                            >
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={async () => {
                                await deleteAffiliationAsync(affiliation?.id);
                                await refetchAffiliations();
                              }}
                            >
                              Remove
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component='div'
              count={affiliationsData?.pagination.total ?? 0}
              rowsPerPage={pageSize}
              page={currentPage - 1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={rows_per_page}
            />
          </Box>
        )}
      </DashboardCard>

      {/* add modal */}
      <Modal
        show={show}
        onHide={handleClose}
        backdrop='static'
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Affiliation Details</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            competitionId: '',
            discountRate: 0,
            discountAmount: 0,
            ownerEmail: '',
          }}
          onSubmit={async (values) => {
            await handleAddAffilation(values);
          }}
        >
          {({ handleSubmit, handleChange, setFieldValue, values }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                {addAffiliationError && (
                  <div className='alert alert-danger' role='alert'>
                    {addAffiliationErrorData?.message}
                  </div>
                )}
                <Row className='mb-3'>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type='email'
                      onChange={handleChange}
                      placeholder='example@company.com'
                      name='ownerEmail'
                      required
                    />
                  </Form.Group>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Competition</Form.Label>
                    <Form.Select
                      defaultValue='Choose...'
                      onChange={(e) =>
                        setFieldValue('competitionId', e.target.value)
                      }
                      required
                    >
                      <option disabled>Choose...</option>
                      {compDatsa?.map((comp, index) => (
                        <option key={index} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Discount Rate (%)</Form.Label>
                    <Form.Control
                      type='number'
                      onChange={handleChange}
                      placeholder='20'
                      name='discountRate'
                      required
                      disabled={values.discountAmount > 0}
                    />
                  </Form.Group>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Discount Amount (£)</Form.Label>
                    <Form.Control
                      type='number'
                      onChange={handleChange}
                      placeholder='10'
                      name='discountAmount'
                      required
                      disabled={values.discountRate > 0}
                    />
                  </Form.Group>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={handleClose}>
                  Close
                </Button>
                <Button type='submit'>Save</Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* update modal */}
      <Modal
        show={showEdit}
        onHide={handleCloseEdit}
        backdrop='static'
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Affiliation Details</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            ...affilationToEdit,
            competitionId: affilationToEdit.competitionId,
            discountAmount: affilationToEdit.discountAmount ?? 0,
            discountRate: affilationToEdit.discountRate
              ? affilationToEdit.discountRate * 100
              : 0,
          }}
          onSubmit={async (values) => {
            values.discountRate = values.discountRate ?? 0;
            values.discountAmount = values.discountAmount ?? 0;
            console.log(values);

            await handleEditditAffiliation(values);
          }}
        >
          {({ handleSubmit, handleChange, setFieldValue, values }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                {editAffiliationError && (
                  <div className='alert alert-danger' role='alert'>
                    {editAffiliationErrorData?.message}
                  </div>
                )}
                <Row className='mb-3'>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type='email'
                      placeholder='example@company.com'
                      name='ownerEmail'
                      value={values.ownerEmail}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Competition</Form.Label>
                    <Form.Select
                      defaultValue='Choose...'
                      value={values.competitionId}
                      onChange={(e) =>
                        setFieldValue('competitionId', e.target.value)
                      }
                      required
                    >
                      <option disabled>Choose...</option>
                      {compDatsa?.map((comp, index) => (
                        <option key={index} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Discount Rate (%)</Form.Label>
                    <Form.Control
                      type='number'
                      value={values.discountRate}
                      onChange={handleChange}
                      placeholder='20'
                      name='discountRate'
                      required
                      disabled={values.discountAmount > 0}
                    />
                  </Form.Group>
                  <Form.Group
                    controlId='formGridState'
                    style={{
                      marginBottom: '20px',
                    }}
                  >
                    <Form.Label>Discount Amount (£)</Form.Label>
                    <Form.Control
                      type='number'
                      value={values.discountAmount}
                      onChange={handleChange}
                      placeholder='10'
                      name='discountAmount'
                      required
                      disabled={values.discountRate > 0}
                    />
                  </Form.Group>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={handleCloseEdit}>
                  Close
                </Button>
                <Button type='submit'>Save</Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
};

export default DashboardAffiliation;
