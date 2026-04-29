/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';

import styles from '@/styles/Dashboard.module.css';
import { api } from '@/trpc/react';
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import 'react-datetime/css/react-datetime.css';
import { Loader } from './Loader';
import { PrimitiveDot } from '@/components/icons';
import { ExportToCsv } from 'export-to-csv';
import { Formik } from 'formik';
import { z } from 'zod';
import { toast } from 'sonner';
import Form from 'react-bootstrap/Form';
import { toFormikValidationSchema } from 'zod-formik-adapter';

const GenerateCSV = () => {
  //this component will generate a csv file with the winners of the competition
  const { mutateAsync: genrateCSV } = api.Order.ordersEmails.useMutation();
  return (
    <div>
      <Button
        onClick={async () => {
          new ExportToCsv({
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true,
            showTitle: false,
            title: 'List of clients',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
          }).generateCsv(await genrateCSV());
        }}
      >
        Generate email list
      </Button>
    </div>
  );
};

const TotalInstaFollower = () => {
  const {
    data: followers,
    isLoading,
    refetch,
    isRefetching,
  } = api.other.instagram.get.useQuery(undefined, {
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
  const { mutateAsync } = api.other.instagram.update.useMutation();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant='primary' onClick={handleShow}>
        Modify Follower count: {isRefetching ? 'Loading...' : followers}
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Total followers</Modal.Title>
        </Modal.Header>
        <Formik
          enableReinitialize
          initialValues={{ followers: followers ?? '' }}
          validationSchema={toFormikValidationSchema(
            z.object({
              followers: z.string(),
            }),
          )}
          onSubmit={async (values, actions) => {
            toast.promise(mutateAsync(values.followers ?? '0K'), {
              loading: 'Saving...',
              success: 'Total followers saved',
              error: 'Failed to save total followers',
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
                  <Form.Label>Total followers</Form.Label>
                  <Form.Control
                    name='followers'
                    value={values.followers}
                    onChange={handleChange}
                    isInvalid={!!errors.followers && touched.followers}
                    placeholder='Enter total followers'
                  />
                  <Form.Control.Feedback type='invalid'>
                    {errors.followers}
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

const DashboardNewsLetters = () => {
  const [show, setShow] = useState({ modal: false, data: '' });
  const { data, isLoading, refetch } = api.Competition.getAll.useQuery();
  const { mutateAsync: sendNewsLetter } =
    api.Winners.sendNewsLetters.useMutation();
  const handleClose = () => {
    setShow({ modal: false, data: '' });
  };

  return (
    <div className={styles.DashCompsMain}>
      <div className={styles.dashCompsTopHeader}>
        <h1>Your NewsLetters</h1>
        <TotalInstaFollower />
      </div>
      <GenerateCSV />
      {isLoading ? (
        <div className={styles.LoaderWrapper}>
          <Loader />
        </div>
      ) : (
        <div className={styles.dashCompsGrid}>
          {data?.map((comp) => {
            if (comp?.Watches == null) return null;
            return (
              comp.status === 'ACTIVE' && (
                <div className={styles.dashGridItem} key={comp.id}>
                  <h2>{comp.name}</h2>
                  <div className={styles.dashGridItemTop}>
                    <p>Creating date : {comp.createdAt.toDateString()}</p>
                    <p>Drawing date : {comp.drawing_date.toDateString()}</p>
                    <p>Ends : {comp.end_date.toDateString()}</p>
                    <p>Remaining Tickets : {comp.remaining_tickets}</p>
                    <p>Winner: {comp.winner ? comp.winner : 'none'}</p>
                  </div>
                  <div className={styles.dashGridItemBot}>
                    <div>
                      <Button
                        onClick={() => setShow({ modal: true, data: comp.id })}
                        variant='primary'
                      >
                        Send NewsLetters
                      </Button>
                    </div>
                    <span
                      style={{
                        color:
                          comp.status === 'ACTIVE'
                            ? 'green'
                            : comp.status === 'NOT_ACTIVE'
                              ? 'red'
                              : 'blue',
                      }}
                    >
                      <PrimitiveDot />
                      {comp.status.valueOf() === 'COMPLETED'
                        ? 'COMPLETED'
                        : comp.status.valueOf() === 'NOT_ACTIVE'
                          ? 'NOT ACTIVE'
                          : 'ACTIVE'}
                    </span>
                  </div>
                  {show.data === comp.id && (
                    <Modal show={show.modal} onHide={handleClose}>
                      <Modal.Header closeButton>
                        <Modal.Title>Confirmation</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>Send NewsLetters ?</Modal.Body>
                      <Modal.Footer>
                        <Button variant='secondary' onClick={handleClose}>
                          Close
                        </Button>
                        <Button
                          variant='primary'
                          onClick={async () => {
                            await sendNewsLetter(comp.id);
                            setShow({ modal: false, data: '' });
                          }}
                        >
                          Send NewsLetters
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  )}
                </div>
              )
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardNewsLetters;
