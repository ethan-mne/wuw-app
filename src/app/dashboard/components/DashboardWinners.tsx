/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import { winnerSchema } from '@/lib/zodSchemas/otherSchemas';
import styles from '@/styles/Dashboard.module.css';
import { api } from '@/trpc/react';
import { PlusOutlined } from '@ant-design/icons';

import { Formik } from 'formik';
import moment from 'moment';
import Image from 'next/image';
import { type ChangeEvent, useState } from 'react';
import { Button, Col } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import 'react-datetime/css/react-datetime.css';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { Loader } from './Loader';
import { fileUpload } from '../fileupload';
import { z } from 'zod';
import { formatCurrency } from '@/lib/formaters';
import { toast } from 'sonner';

const handleFileChange = async (
  e: ChangeEvent<HTMLInputElement>,
  tickerID: string | undefined,
  setFieldValue: (value: string | null) => Promise<unknown>,
) => {
  const file = e.target.files?.[0];
  if (!file) {
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  const { url, error } = await fileUpload(
    formData,
    tickerID ? `winners/${tickerID}` : undefined,
  );
  if (error) {
    console.error(error);
    return;
  }
  await setFieldValue(url);
};
const AddWinnerForm = ({
  show,
  handleClose,
  refetchWinners,
}: {
  show: boolean;
  handleClose: () => void;
  refetchWinners: () => Promise<unknown>;
}) => {
  const {
    mutateAsync: findWinners,
    data: winnerTicketData,
    isLoading: isWinnerTicketLoading,
  } = api.winners.getTicket.useMutation();
  const { mutateAsync: addWinner } = api.winners.add.useMutation();
  // this should us the upload query to upload the file
  const [tickerID, setTicketID] = useState<string>();
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header>
        <Modal.Title>Add a Winner</Modal.Title>
      </Modal.Header>
      <Formik
        validationSchema={toFormikValidationSchema(
          winnerSchema.omit({ id: true }),
        )}
        onSubmit={async (values, actions) => {
          actions.setSubmitting(true);
          await addWinner({
            ...values,
            value: Number(values.value),
            date: values.date ? new Date(values.date) : null,
            order_id: winnerTicketData ? winnerTicketData.Order.id : null,
          });
          await refetchWinners();
          actions.setSubmitting(false);
          handleClose();
        }}
        initialValues={{
          name: null as string | null,
          value: 0,
          date: new Date(),
          watch_name: null as string | null,
          img: null as string | null,
          src: null as string | null,
        }}
        // enableReinitialize={true}
      >
        {({
          handleSubmit,
          handleChange,
          isSubmitting,
          errors,
          values,
          setFieldValue,
          setValues,
        }) => (
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row className='mb-3'>
                <Form.Group as={Col}>
                  <Form.Label>Winner Ticket </Form.Label>
                  <Form.Control
                    type='text'
                    onChange={async (e) => {
                      setTicketID(e.target.value);
                      const data = await findWinners(e.target.value);
                      await setValues({
                        name: data
                          ? `${data.Order.first_name} ${data.Order.last_name}`
                          : null,
                        value: data ? data.Competition.price : 0,
                        date: data ? data.Competition.drawing_date : new Date(),
                        watch_name: data ? data.Competition.name : null,
                        img: null,
                        src: null,
                      });
                    }}
                    value={tickerID}
                    placeholder='Enter Ticket ID'
                    name='ticket_id'
                  />
                  {isWinnerTicketLoading
                    ? 'Loading...'
                    : winnerTicketData && (
                        <Modal.Body>
                          <Form.Label>
                            {"Winner's Name: " +
                              winnerTicketData?.Order.first_name +
                              ' ' +
                              winnerTicketData?.Order.last_name}
                          </Form.Label>
                          <Form.Label>
                            {'Order ID: ' + winnerTicketData?.Order.id}
                          </Form.Label>
                        </Modal.Body>
                      )}
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group className='mb-3'>
                  <Form.Label>Winner Image</Form.Label>
                  <Form.Control
                    type='file'
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleFileChange(e, tickerID, (value) =>
                        setFieldValue('img', value),
                      )
                    }
                    name='img'
                  />
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group className='mb-3'>
                  <Form.Label>Winner Video</Form.Label>
                  <Form.Control
                    type='file'
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleFileChange(e, tickerID, (value) =>
                        setFieldValue('src', value),
                      )
                    }
                    name='video'
                  />
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group as={Col}>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type='text'
                    onChange={handleChange}
                    value={values.name ?? ''}
                    placeholder='Enter Name'
                    name='name'
                  />
                </Form.Group>
                <Form.Group as={Col}>
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    type='number'
                    onChange={handleChange}
                    value={values.value}
                    placeholder='Enter Value'
                    name='value'
                  />
                </Form.Group>
              </Row>
              <Row className='mb-3'>
                <Form.Group as={Col}>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type='date'
                    onChange={handleChange}
                    value={
                      values.date
                        ? moment(values.date).format('YYYY-MM-DD')
                        : ''
                    }
                    name='date'
                  />
                </Form.Group>
                <Form.Group as={Col}>
                  <Form.Label>Watch Name</Form.Label>
                  <Form.Control
                    type='text'
                    onChange={handleChange}
                    value={values.watch_name ?? ''}
                    placeholder='Enter Watch Name'
                    name='watch_name'
                  />
                </Form.Group>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant='secondary' onClick={handleClose}>
                Close
              </Button>
              <Button variant='primary' type='submit'>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

const TotalAmountForm = () => {
  const { data, isLoading, refetch, isRefetching } = api.AmountWon.get.useQuery(
    {},
  );
  const { mutateAsync } = api.AmountWon.update.useMutation();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant='primary' onClick={handleShow}>
        Modify Total Amount:{' '}
        {isRefetching ? 'Loading...' : formatCurrency(data ?? 0)}
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Total Amount</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{ total_amount: data ?? 0 }}
          validationSchema={toFormikValidationSchema(
            z.object({
              total_amount: z
                .number()
                .min(0, { message: 'Total amount must be a positive number' }),
            }),
          )}
          onSubmit={async (values, actions) => {
            toast.promise(mutateAsync(values.total_amount), {
              loading: 'Saving...',
              success: 'Total amount saved successfully',
              error: 'Failed to save total amount',
            });
            actions.setSubmitting(false);
            handleClose();
            await refetch();
          }}
        >
          {({ values, handleChange, handleSubmit, errors, touched }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Form.Group>
                  <Form.Label>Total Amount</Form.Label>
                  <Form.Control
                    type='number'
                    name='total_amount'
                    value={values.total_amount}
                    onChange={handleChange}
                    isInvalid={!!errors.total_amount && touched.total_amount}
                    placeholder='Enter total amount'
                  />
                  <Form.Control.Feedback type='invalid'>
                    {errors.total_amount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={handleClose}>
                  Close
                </Button>
                <Button variant='primary' type='submit'>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default function DashboardWinners() {
  const {
    data: winners,
    isLoading: isWinnersLoading,
    refetch: refetchWinners,
  } = api.winners.get.useQuery();
  const { mutateAsync: updateWinner } = api.winners.update.useMutation();
  const { mutateAsync: deleteWinner } = api.winners.delete.useMutation();
  const [remove, setRemove] = useState({ modal: false, id: '' });
  const handleNoRemove = () => {
    setRemove({ modal: false, id: '' });
  };

  const [add, setAdd] = useState(false);
  const [show, setShow] = useState({ modal: false, data: 0 });
  const handleClose = () => {
    setShow({ modal: false, data: 0 });
  };
  const handleShow = (i: number) => {
    setShow({ modal: true, data: i });
  };

  const missingImageCount = winners?.filter((w) => !w.img).length ?? 0;

  return (
    <div className={styles.DashCompsMain}>
      <div className={styles.dashCompsTopHeader}>
        <h1>Winners</h1>
        <TotalAmountForm />
        <Button onClick={() => setAdd(true)} variant='primary'>
          <PlusOutlined /> Add
        </Button>
      </div>

      {missingImageCount > 0 && (
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#856404',
            fontWeight: 500,
          }}
        >
          ⚠️ {missingImageCount} winner{missingImageCount > 1 ? 's are' : ' is'}{' '}
          missing an image and will not be displayed on the home page. Upload an
          image via <strong>Manage</strong>.
        </div>
      )}

      {isWinnersLoading ? (
        <div className={styles.LoaderWrapper}>
          <Loader />
        </div>
      ) : (
        <div className={styles.dashCompsGrid}>
          {winners?.map((winner, i) => (
            <div
              className={styles.dashWatchesGridItem}
              key={winner.id}
              style={!winner.img ? { outline: '2px solid #ffc107' } : undefined}
            >
              <div className={styles.WatchGridIMG}>
                {winner.img ? (
                  <Image
                    width={200}
                    height={200}
                    style={{ objectFit: 'cover' }}
                    src={winner.img}
                    alt='winnerImage'
                  />
                ) : (
                  <p>No Image</p>
                )}
                <h2>{winner.name}</h2>
              </div>
              <div className={styles.dashWatchGridDet}>
                <div className={styles.dashGridItemTop}>
                  <p>Value: {winner.value}</p>
                  <p>
                    Date:{' '}
                    {winner.date
                      ? moment(winner.date).format('DD/MM/YYYY')
                      : ''}
                  </p>
                  <p>Watch Name: {winner.watch_name}</p>
                </div>
                <div className={styles.dashGridItemBot}>
                  <div>
                    <Button
                      onClick={() =>
                        Promise.all([deleteWinner(winner.id), refetchWinners()])
                      }
                      variant='danger'
                    >
                      Remove
                    </Button>
                    <Button variant='secondary' onClick={() => handleShow(i)}>
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
              {show.data === i && (
                <Modal size='lg' show={show.modal} onHide={handleClose}>
                  <Modal.Header closeButton>
                    <Modal.Title>Manage Winner</Modal.Title>
                  </Modal.Header>
                  <Formik
                    onSubmit={async (values, actions) => {
                      setShow({ modal: false, data: 0 });
                      await updateWinner({
                        ...values,
                      });
                      await refetchWinners();
                      actions.setSubmitting(false);
                    }}
                    validationSchema={toFormikValidationSchema(
                      winnerSchema.omit({
                        id: true,
                      }),
                    )}
                    initialValues={{
                      ...winner,
                    }}
                  >
                    {({
                      values,
                      handleSubmit,
                      handleChange,
                      isSubmitting,
                      setFieldValue,
                    }) => (
                      <Form onSubmit={handleSubmit}>
                        <Modal.Body>
                          <Row className='mb-3'>
                            <Form.Group as={Col}>
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                type='text'
                                value={values.name ?? ''}
                                onChange={handleChange}
                                placeholder='Enter Name'
                                name='name'
                                required
                              />
                            </Form.Group>
                          </Row>
                          <Row className='mb-3'>
                            <Form.Group className='mb-3'>
                              <Form.Label>Date of the draw </Form.Label>
                              <Form.Control
                                type='date'
                                onChange={handleChange}
                                value={
                                  values.date
                                    ? moment(values.date).format('YYYY-MM-DD')
                                    : ''
                                }
                                name='date'
                              />
                            </Form.Group>

                            <Form.Group as={Col}>
                              <Form.Label>Watch Name</Form.Label>
                              <Form.Control
                                type='text'
                                value={values.watch_name ?? ''}
                                onChange={handleChange}
                                placeholder='Enter Watch Name'
                                name='watch_name'
                              />
                            </Form.Group>
                          </Row>
                          <Row className='mb-3'>
                            <Form.Group className='mb-3'>
                              <Form.Label>Winner Image</Form.Label>
                              <Form.Control
                                type='file'
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleFileChange(e, undefined, (value) =>
                                    setFieldValue('img', value),
                                  )
                                }
                                name='img'
                              />
                            </Form.Group>
                            <Form.Group className='mb-3'>
                              <Form.Label>Winner Video</Form.Label>
                              <Form.Control
                                type='file'
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleFileChange(e, undefined, (value) =>
                                    setFieldValue('src', value),
                                  )
                                }
                                name='video'
                              />
                            </Form.Group>
                            <Form.Group className='mb-3'>
                              <Form.Label>Name of Competition</Form.Label>
                              <Form.Control
                                name='name'
                                onChange={handleChange}
                                value={values.name ?? ''}
                                placeholder='Enter Name'
                              />
                            </Form.Group>
                            <Form.Group as={Col} controlId='formGridPassword'>
                              <Form.Label>Value</Form.Label>
                              <Form.Control
                                type='number'
                                onChange={handleChange}
                                value={values.value ?? 0}
                                placeholder='Enter Value'
                                name='value'
                              />
                            </Form.Group>
                          </Row>
                        </Modal.Body>

                        <Modal.Footer>
                          <Button variant='secondary' onClick={handleClose}>
                            Close
                          </Button>
                          <Button variant='primary' type='submit'>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Modal.Footer>
                      </Form>
                    )}
                  </Formik>
                </Modal>
              )}
            </div>
          ))}
        </div>
      )}
      <AddWinnerForm
        show={add}
        handleClose={() => setAdd(false)}
        refetchWinners={refetchWinners}
      />

      <Modal show={remove.modal} onHide={handleNoRemove}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Do you wish to delete this winner?</Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleNoRemove}>
            Cancel
          </Button>
          <Button
            variant='danger'
            onClick={async () => {
              setRemove({ modal: false, id: '' });
            }}
          >
            Remove
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
