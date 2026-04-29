'use client';

import { DateFormater, Formater } from '@/lib/utils';
import styles from '@/styles/Dashboard.module.css';
import { api } from '@/trpc/react';
import { Fade } from '@mui/material';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Field, Form, Formik } from 'formik';
import { useState, type ChangeEvent } from 'react';
import { Alert, Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import 'react-datetime/css/react-datetime.css';
import { Loader } from './Loader';
import { PrimitiveDot } from '@/components/icons';

const DashboardFreeTickets = () => {
  const [open, setOpen] = useState({
    opened: false,
    orderID: '',
  });
  const [resend, setResend] = useState({
    open: false,
    id: '',
  });
  const { mutateAsync: SendFreeTickets, isLoading: isLoadingEmail } =
    api.Order.SendFreeTickets_fixed.useMutation();
  //todo: remove this
  const { data: competitions } = api.Order.getComps.useQuery();

  const { data, isLoading } = api.Competition.getAll.useQuery();

  // UPDATE
  const [show, setShow] = useState({ modal: false, data: '' });

  // HANDLE UPDATE MODAL FORM
  const handleClose = () => {
    setShow({ modal: false, data: '' });
  };
  const handleShow = (i: string) => {
    setShow({
      modal: true,
      data: i,
    });
  };
  //DATA FROM BACKEND

  const { data: orders } = api.Order.getAll.useQuery(show.data);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  return (
    <div className={styles.DashCompsMain}>
      <div className={styles.dashCompsTopHeader}>
        <h1>Send Free Tickets</h1>
      </div>
      {isLoading || data === null || !data ? (
        <div className={styles.LoaderWrapper}>
          <Loader />
        </div>
      ) : (
        <div className={styles.dashCompsGrid}>
          {data.map((comp) => (
            <div className={styles.dashGridItem} key={comp.id}>
              <h2>{comp.name}</h2>
              <div className={styles.dashGridItemTop}>
                <p>Creating date : {comp.createdAt.toDateString()}</p>
                <p>Drawing date : {comp.drawing_date.toDateString()}</p>
                <p>Ends : {comp.end_date.toDateString()}</p>
                <p>Remaining Tickets : {comp.remaining_tickets}</p>
                <p>
                  Prize : {comp.Watches.brand} {comp.Watches.model}
                </p>
                {comp.winner && <p>Winner : {comp.winner}</p>}
              </div>
              <div className={styles.dashGridItemBot}>
                <div>
                  <Button
                    variant='secondary'
                    onClick={() => handleShow(comp.id)}
                  >
                    Manage
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
                <Modal
                  style={{ width: '100vw' }}
                  size='xl'
                  show={show.modal}
                  onHide={handleClose}
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Manage your competition</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Paper sx={{ width: '100%', mb: 2 }}>
                      <TableContainer component={Paper}>
                        <Table
                          style={{ tableLayout: 'auto' }}
                          aria-label='collapsible table'
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>
                                <p style={{ marginBottom: '0' }}>Full Name</p>
                              </TableCell>
                              <TableCell align='center'>
                                <p style={{ marginBottom: '0' }}>Email</p>
                              </TableCell>
                              <TableCell align='right'>
                                <p style={{ marginBottom: '0' }}>
                                  Total Tickets
                                </p>
                              </TableCell>
                              <TableCell align='right'>
                                <p style={{ marginBottom: '0' }}>Total Price</p>
                              </TableCell>
                              <TableCell align='right'>
                                <p style={{ marginBottom: '0' }}>Status</p>
                              </TableCell>

                              <TableCell align='right'>
                                <p style={{ marginBottom: '0' }}>Created At</p>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {orders
                              ?.slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage,
                              )
                              .filter(
                                (order) =>
                                  order.status !== 'INCOMPLETE' &&
                                  order.status !== 'PENDING',
                              )

                              .map((row) => (
                                <>
                                  <TableRow
                                    key={row.id}
                                    hover
                                    onClick={() =>
                                      setOpen({
                                        opened: !open.opened,
                                        orderID: row.id,
                                      })
                                    }
                                    sx={{
                                      '& > *': {
                                        borderBottom: 'unset',
                                        cursor: 'pointer',
                                      },
                                    }}
                                  >
                                    <TableCell component='th' scope='row'>
                                      {row.first_name} {row.last_name}
                                    </TableCell>

                                    <TableCell align='right'>
                                      {row.email}
                                    </TableCell>
                                    <TableCell align='right'>
                                      {row.Ticket.length}
                                    </TableCell>
                                    <TableCell align='right'>
                                      {Formater(row.totalPrice)}
                                    </TableCell>
                                    <TableCell align='right'>
                                      {row.status}
                                    </TableCell>

                                    <TableCell align='right'>
                                      {DateFormater(row.createdAt)}
                                    </TableCell>
                                  </TableRow>

                                  <TableRow>
                                    <TableCell
                                      style={{
                                        paddingBottom: 0,
                                        paddingTop: 0,
                                      }}
                                      colSpan={6}
                                    >
                                      <Collapse
                                        in={
                                          row.id === open.orderID && open.opened
                                        }
                                        timeout='auto'
                                        unmountOnExit
                                      >
                                        <Box
                                          sx={{
                                            margin: 1,
                                            width: '100%',
                                          }}
                                        >
                                          {row.id === resend.id && (
                                            <Fade
                                              in={resend.open} //Write the needed condition here to make it appear
                                              timeout={{
                                                enter: 1000,
                                                exit: 1000,
                                              }} //Edit these two values to change the duration of transition when the element is getting appeared and disappeard
                                              addEndListener={() => {
                                                setTimeout(() => {
                                                  setResend({
                                                    open: false,
                                                    id: '',
                                                  });
                                                }, 2000);
                                              }}
                                            >
                                              <Alert
                                                style={{
                                                  transition: ' 0.5s all',
                                                }}
                                                variant='success'
                                              >
                                                Email for Free Tickets sent!
                                              </Alert>
                                            </Fade>
                                          )}
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '1rem',
                                            }}
                                          >
                                            <Typography
                                              variant='h6'
                                              gutterBottom
                                              component='div'
                                            >
                                              Send Free Tickets
                                            </Typography>
                                          </Box>
                                          {competitions?.[0] && (
                                            <Formik
                                              initialValues={{
                                                tickets: row.Ticket.length,
                                                comp: competitions[0].id,
                                              }}
                                              onSubmit={async (
                                                values,
                                                { setSubmitting },
                                              ) => {
                                                await SendFreeTickets({
                                                  compId: values.comp,
                                                  orderId: row.id,
                                                  numTickts: values.tickets,
                                                });
                                                console.log(values);
                                                setResend({
                                                  id: row.id,
                                                  open: true,
                                                });
                                                setSubmitting(false);
                                              }}
                                            >
                                              {({
                                                values,
                                                isSubmitting,
                                                setValues,
                                                setFieldValue,
                                                errors,
                                                touched,
                                                handleSubmit,
                                              }) => (
                                                <Form
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                  }}
                                                >
                                                  <Field
                                                    name='tickets'
                                                    type='number'
                                                  />
                                                  <Field
                                                    as='select'
                                                    name='comp'
                                                  >
                                                    {competitions?.map(
                                                      (compe) => {
                                                        return (
                                                          <option
                                                            key={compe.id}
                                                            value={compe.id}
                                                          >
                                                            {compe.name}
                                                          </option>
                                                        );
                                                      },
                                                    )}
                                                  </Field>
                                                  <Button
                                                    disabled={isLoadingEmail}
                                                    size='sm'
                                                    type='submit'
                                                    style={{
                                                      width: 'max-content',
                                                    }}
                                                  >
                                                    Send Tickets
                                                  </Button>
                                                </Form>
                                              )}
                                            </Formik>
                                          )}
                                        </Box>
                                      </Collapse>
                                    </TableCell>
                                  </TableRow>
                                </>
                              ))}
                          </TableBody>
                        </Table>
                        <TablePagination
                          rowsPerPageOptions={[5, 15, 100]}
                          component='div'
                          count={orders ? orders.length : -1}
                          rowsPerPage={rowsPerPage}
                          page={page}
                          onPageChange={handleChangePage}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                      </TableContainer>
                    </Paper>
                  </Modal.Body>
                </Modal>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardFreeTickets;
